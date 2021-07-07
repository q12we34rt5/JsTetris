class makeGallery {
    constructor(element) {
        this.gallery_pages_width = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gallery-page-width'));
        this.gallery_pages_height = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gallery-page-height'));
        this.gallery_pages_gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gallery-page-gap'));
        this.elementSelector = element;
        this.gallery = document.querySelector(element);
        this.gallery_pages = 0;
        this.current_gallery_page = 0;
        this.gallery_page_scoller = document.querySelector(element + " .gallery-page-scoller");
        this.gallery_page_scoller.childNodes.forEach(element => {
            this.gallery_pages += element.tagName == "DIV";
        });
        // set scoller div width
        this.gallery_page_scoller.style.width = this.gallery_pages * (this.gallery_pages_width + this.gallery_pages_gap) + "px";
        // get action element
        var gallery_page_left_trigger = document.querySelector(element + " .gallery-page-scoller-action-left-trigger");
        var gallery_page_right_trigger = document.querySelector(element + " .gallery-page-scoller-action-right-trigger");
        // set action function
        gallery_page_left_trigger.onclick = this.movePrevious;
        gallery_page_right_trigger.onclick = this.moveNext;
        // set main object
        gallery_page_left_trigger.galleryObject = this;
        gallery_page_right_trigger.galleryObject = this;
    }
    moveNext() {
        var galleryObject = this.galleryObject;
        galleryObject.current_gallery_page = (galleryObject.current_gallery_page + 1) % galleryObject.gallery_pages;
        galleryObject.gallery_page_scoller.style.marginLeft = -galleryObject.current_gallery_page * (galleryObject.gallery_pages_width + galleryObject.gallery_pages_gap) + "px";
    }
    movePrevious() {
        var galleryObject = this.galleryObject;
        galleryObject.current_gallery_page = (galleryObject.current_gallery_page + galleryObject.gallery_pages - 1) % galleryObject.gallery_pages;
        galleryObject.gallery_page_scoller.style.marginLeft = -galleryObject.current_gallery_page * (galleryObject.gallery_pages_width + galleryObject.gallery_pages_gap) + "px";
    }
    jsMoveNext() {
        this.current_gallery_page = (this.current_gallery_page + 1) % this.gallery_pages;
        this.gallery_page_scoller.style.marginLeft = -this.current_gallery_page * (this.gallery_pages_width + this.gallery_pages_gap) + "px";
    }
    jsMovePrevious() {
        this.current_gallery_page = (this.current_gallery_page + this.gallery_pages - 1) % this.gallery_pages;
        this.gallery_page_scoller.style.marginLeft = -this.current_gallery_page * (this.gallery_pages_width + this.gallery_pages_gap) + "px";
    }
}