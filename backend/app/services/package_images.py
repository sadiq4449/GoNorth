"""Cover image paths for seeded marketplace tour packages."""

PACKAGE_IMAGE_URLS: dict[str, str | None] = {
    "skardu-valley-explorer": "/assets/skardu.jfif",
    "hunza-cherry-blossom": "/assets/huza.jfif",
    "deosai-plateau-adventure": "/assets/desai.jfif",
    "khaplu-heritage-trail": "/assets/khapulu.jfif",
    "shigar-fort-retreat": "/assets/shigargb.jpg",
    "basho-meadows-trek": "/assets/basho.jfif",
}


def ensure_package_images(db) -> None:
    from app.db.models import TourPackage

    for slug, url in PACKAGE_IMAGE_URLS.items():
        pkg = db.query(TourPackage).filter(TourPackage.slug == slug).first()
        if pkg is not None:
            pkg.image_url = url or ""
    db.commit()
