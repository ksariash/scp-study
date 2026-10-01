#!/usr/bin/env python3
from __future__ import annotations
import argparse, base64, gzip, io, json, math, re, shutil, sys, tarfile
from pathlib import Path

DYNAMIC = [
    "SCP-Study-Cumulative-Test.pdf",
    "SCP-Study-Cumulative-Test-Answer-Key.pdf",
    "SCP-Study-Essay-Questions-and-Sample-Answers.pdf",
]
COMPACT = "SCP-Study-Compact-Course-Review.pdf"

def extract_bundle(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    parts = sorted(Path("assets").glob("static-binaries.tar.gz.b64.*.part"))
    if not parts:
        raise SystemExit("No static binary bundle parts found")
    encoded = "".join(p.read_text(encoding="utf-8") for p in parts)
    archive = gzip.decompress(base64.b64decode(encoded))
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:") as tf:
        wanted = set(DYNAMIC + [COMPACT])
        found = set()
        for member in tf.getmembers():
            name = member.name.lstrip("./")
            if not name.startswith("documents/") or Path(name).name not in wanted:
                continue
            source = tf.extractfile(member)
            if not source:
                continue
            target = out / Path(name).name
            target.write_bytes(source.read())
            found.add(target.name)
    missing = wanted - found
    if missing:
        raise SystemExit("Missing reference PDFs in bundle: " + ", ".join(sorted(missing)))

def norm_text(value: str) -> str:
    return re.sub(r"\s+", " ", value or "").strip()

def compare(reference: Path, generated: Path, out: Path) -> bool:
    import fitz
    from PIL import Image, ImageChops

    out.mkdir(parents=True, exist_ok=True)
    renders = out / "renders"
    renders.mkdir(exist_ok=True)
    summary = {"files": {}, "all_match": True}
    all_match = True

    for filename in DYNAMIC:
        ref_path = reference / filename
        gen_path = generated / "documents" / filename
        if not ref_path.exists() or not gen_path.exists():
            summary["files"][filename] = {"error": "missing file"}
            all_match = False
            continue

        ref = fitz.open(ref_path)
        gen = fitz.open(gen_path)
        item = {
            "reference_pages": ref.page_count,
            "generated_pages": gen.page_count,
            "page_count_match": ref.page_count == gen.page_count,
            "pages": [],
        }
        file_match = item["page_count_match"]

        page_count = max(ref.page_count, gen.page_count)
        for page_index in range(page_count):
            page = {"page": page_index + 1}
            if page_index >= ref.page_count or page_index >= gen.page_count:
                page["missing"] = "reference" if page_index >= ref.page_count else "generated"
                file_match = False
                item["pages"].append(page)
                continue

            rp = ref[page_index]
            gp = gen[page_index]
            ref_text = norm_text(rp.get_text("text"))
            gen_text = norm_text(gp.get_text("text"))
            page["text_match"] = ref_text == gen_text
            page["reference_text_chars"] = len(ref_text)
            page["generated_text_chars"] = len(gen_text)
            page["size_match"] = tuple(round(x, 2) for x in rp.rect) == tuple(round(x, 2) for x in gp.rect)

            matrix = fitz.Matrix(2, 2)
            r_pix = rp.get_pixmap(matrix=matrix, alpha=False)
            g_pix = gp.get_pixmap(matrix=matrix, alpha=False)
            r_img = Image.frombytes("RGB", [r_pix.width, r_pix.height], r_pix.samples)
            g_img = Image.frombytes("RGB", [g_pix.width, g_pix.height], g_pix.samples)
            page_dir = renders / filename.replace(".pdf", "")
            page_dir.mkdir(exist_ok=True)
            r_img.save(page_dir / f"p{page_index+1:02d}-reference.png")
            g_img.save(page_dir / f"p{page_index+1:02d}-generated.png")

            if r_img.size == g_img.size:
                diff = ImageChops.difference(r_img, g_img)
                hist = diff.histogram()
                total = sum(hist)
                weighted = sum((i % 256) * count for i, count in enumerate(hist))
                page["mean_channel_delta"] = round(weighted / total, 4) if total else 0
                bbox = diff.getbbox()
                page["pixel_identical"] = bbox is None
                if bbox is not None:
                    diff.save(page_dir / f"p{page_index+1:02d}-diff.png")
            else:
                page["pixel_identical"] = False
                page["render_size_match"] = False

            # For this regression, match means same pagination, same extracted text,
            # and effectively the same visual layout. A tiny mean delta tolerates
            # renderer/font rasterization differences without tolerating layout drift.
            page_match = page["text_match"] and page["size_match"] and page.get("mean_channel_delta", 999) <= 0.35
            page["match"] = page_match
            file_match = file_match and page_match
            item["pages"].append(page)

        item["match"] = file_match
        summary["files"][filename] = item
        all_match = all_match and file_match

    summary["all_match"] = all_match
    (out / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return all_match

def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    p_extract = sub.add_parser("extract")
    p_extract.add_argument("--out", required=True)
    p_compare = sub.add_parser("compare")
    p_compare.add_argument("--reference", required=True)
    p_compare.add_argument("--generated", required=True)
    p_compare.add_argument("--out", required=True)
    args = parser.parse_args()

    if args.command == "extract":
        extract_bundle(Path(args.out))
    elif args.command == "compare":
        ok = compare(Path(args.reference), Path(args.generated), Path(args.out))
        raise SystemExit(0 if ok else 1)

if __name__ == "__main__":
    main()
