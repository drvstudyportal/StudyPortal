(function ($) {
    "use strict";

    // --- UTILITY FUNCTIONS & INITIALIZATIONS ---

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    
    // Call spinner immediately for faster loading
    if (typeof jQuery !== 'undefined') {
        spinner();
    }

    // Function to modify the Google Drive link for embedding
    function getEmbedUrl(driveLink) {
        if (driveLink && driveLink.includes("drive.google.com/file/d/")) {
            const fileIdMatch = driveLink.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (fileIdMatch && fileIdMatch[1]) {
                // Reconstruct the URL using the /preview endpoint
                return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
            }
        }
        return null; 
    }

    // Initialize carousels and other features when document is ready
    $(document).ready(function() {
        // Hide spinner
        spinner();

        // Initialize WOW.js for animations
        if (typeof WOW !== 'undefined') {
            new WOW().init();
        }

        // Scroll animation handler for .scroll-animate elements
        function initScrollAnimations() {
            const scrollAnimateElements = $('.scroll-animate');
            
            if (scrollAnimateElements.length === 0) return;
            
            // Function to check if element is in viewport (with offset)
            function isInViewport(element, offset = 100) {
                const rect = element.getBoundingClientRect();
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                const windowWidth = window.innerWidth || document.documentElement.clientWidth;
                
                return (
                    rect.top < windowHeight - offset &&
                    rect.bottom > offset &&
                    rect.left < windowWidth &&
                    rect.right > 0
                );
            }
            
            // Check on scroll and on load
            function checkScrollAnimations() {
                scrollAnimateElements.each(function() {
                    const $el = $(this);
                    // Only add animate class if not already animated and element is in viewport
                    // Once animated, keep it animated (don't remove the class)
                    if (!$el.hasClass('animate')) {
                        if (isInViewport(this, 50)) {
                            $el.addClass('animate');
                        }
                    }
                });
            }
            
            // Initial check - run multiple times to catch all elements
            setTimeout(checkScrollAnimations, 50);
            setTimeout(checkScrollAnimations, 200);
            setTimeout(checkScrollAnimations, 500);
            
            // Check on scroll with requestAnimationFrame for smooth performance
            let ticking = false;
            $(window).on('scroll', function() {
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        checkScrollAnimations();
                        ticking = false;
                    });
                    ticking = true;
                }
            });
            
            // Also check when window is resized
            $(window).on('resize', function() {
                checkScrollAnimations();
            });
        }
        
        // Initialize scroll animations
        initScrollAnimations();

        // Header carousel initialization
        if ($(".header-carousel").length) {
            $(".header-carousel").owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                items: 1,
                dots: false,
                loop: true,
                nav: true,
                navText: [
                    '<i class="fa fa-angle-left"></i>',
                    '<i class="fa fa-angle-right"></i>'
                ],
                autoplayTimeout: 5000,
                autoplayHoverPause: true
            });
        }

        // Testimonials carousel
        if ($(".testimonial-carousel").length) {
            $(".testimonial-carousel").owlCarousel({
                autoplay: true,
                smartSpeed: 1000,
                center: true,
                margin: 24,
                dots: true,
                loop: true,
                nav : false,
                responsive: {
                    0:{ items:1 },
                    768:{ items:2 },
                    992:{ items:3 }
                }
            });
        }
    });

    // Sticky Navbar
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.sticky-top').css('top', '0px');
        } else {
            $('.sticky-top').css('top', '-100px');
        }
    });

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
        return false;
    });

    // --- DOCUMENT READY: MAIN BLOG/API LOGIC ---

    $(document).ready(function () {
        const SECRET_PASSKEY = 'qwerty'; // Your passkey
        const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x400?text=StudyPortal+Document'; // Fallback image
        const projectId = '8myqcpgd';
        const dataset = 'production';
        
        // --- Sanity API Fetcher for Blog LIST Page ---
        function fetchSanityPosts() {
            const query = encodeURIComponent(`
                *[_type == "post"]|order(publishedAt desc){
                    title,
                    "slug": slug.current,
                    publishedAt,
                    body[]{
                        ...,
                        _type == "image" => {
                            ...,
                            asset->{
                                _id,
                                url
                            }
                        }
                    },
                    "imageUrl": image.asset->url,
                    googleDriveUrl 
                }
            `);
            const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${query}`;
            
            $('#sanity-blog-posts').html('<p class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Loading blog posts...</p>');
            
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    if (data.result && data.result.length) {
                        let postsHtml = '';
                        data.result.forEach(post => {
                            let bodyText = '';
                            let cardImage = post.imageUrl || null;
                            
                            if (post.body && Array.isArray(post.body)) {
                                // Extract first image from body if no main image exists
                                if (!cardImage) {
                                    for (let block of post.body) {
                                        if (block._type === 'image' && block.asset && block.asset.url) {
                                            cardImage = block.asset.url;
                                            break;
                                        }
                                        // Also check for image URLs in text
                                        if (block._type === 'block' && block.children) {
                                            for (let child of block.children) {
                                                if (child.text) {
                                                    const imageUrlPattern = /(https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?[^\s<>"']*)?)/i;
                                                    const match = child.text.match(imageUrlPattern);
                                                    if (match && match[0]) {
                                                        cardImage = match[0];
                                                        break;
                                                    }
                                                }
                                            }
                                            if (cardImage) break;
                                        }
                                    }
                                }
                                
                                // Extract text for preview
                                bodyText = post.body.map(block => {
                                    if (block._type === 'block' && block.children) {
                                        return block.children.map(child => child.text || '').join('');
                                    }
                                    return '';
                                }).join(' ').substring(0, 150) + '...'; 
                            }
                            
                            // Make links clickable in preview text
                            const urlPattern = /(https?:\/\/[^\s<>"']+)/gi;
                            bodyText = bodyText.replace(urlPattern, (url) => {
                                return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary); text-decoration: underline;">${url}</a>`;
                            });
                            
                            const finalImage = cardImage || PLACEHOLDER_IMG;
                            
                            // Ensure slug is properly URL encoded
                            const slugValue = post.slug ? encodeURIComponent(post.slug) : 'n/a';
                            
                            postsHtml += `
                                <div class="col-lg-4 col-md-6 wow fadeInUp" data-wow-delay="0.1s">
                                    <div class="course-item bg-light rounded overflow-hidden shadow-sm">
                                        <div class="position-relative overflow-hidden" style="height: 200px; background: #f8f9fa; display: flex; align-items: center; justify-content: center;">
                                            <img class="img-fluid blog-card-image" 
                                                 src="${finalImage}" 
                                                 alt="${post.title}" 
                                                 onerror="this.onerror=null;this.src='${PLACEHOLDER_IMG}';"
                                                 style="max-width: 100%; max-height: 100%; object-fit: contain; object-position: center; display: block; transition: transform 0.3s ease;">
                                            <div class="w-100 d-flex justify-content-center position-absolute bottom-0 start-0 mb-4">
                                                <a href="blog-detail.html?slug=${slugValue}" class="flex-shrink-0 btn btn-sm btn-primary px-3" style="border-radius: 30px;">
                                                    <i class="fa fa-book-open"></i> Read More
                                                </a>
                                            </div>
                                        </div>
                                        <div class="p-4 pb-0">
                                            <h5 class="mb-4">${post.title}</h5>
                                            <div class="mb-3 text-muted" style="font-size: 0.9rem;">${bodyText}</div>
                                        </div>
                                        <div class="d-flex border-top">
                                            <small class="flex-fill text-center py-2"><i class="fa fa-calendar-alt text-primary me-2"></i>${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}</small>
                                        </div>
                                    </div>
                                </div>`;
                        });
                        $('#sanity-blog-posts').html(postsHtml);
                        new WOW().init();
                        
                    } else {
                        $('#sanity-blog-posts').html('<p class="text-center">No blog posts found.</p>');
                    }
                },
                error: function (xhr, status, error) {
                    $('#sanity-blog-posts').html(`<p class="text-center text-danger">Error loading posts: ${error}</p>`);
                }
            });
        }
        
        // Only run fetchSanityPosts on the blog list page
        if ($('#sanity-blog-posts').length) {
            fetchSanityPosts();
        }

        // --- Modal & Passkey Logic (Unchanged) ---
        
        $('#post-blog-btn').click(function () {
            $('#passkey-input').val('');
            $('#passkey-error').addClass('d-none');
            $('#postBlogModal').modal('hide'); 
            $('#passkeyModal').modal('show');
        });
        
        $('#verify-passkey-btn').click(function () {
            const enteredKey = $('#passkey-input').val();
            if (enteredKey === SECRET_PASSKEY) {
                $('#passkeyModal').modal('hide');
                
                $('#blog-title').val('');
                $('#blog-date').val(new Date().toISOString().substring(0, 10)); 
                $('#blog-image-upload').val('');
                $('#image-preview-container').hide();
                $('#image-preview').attr('src', '');
                $('#blog-body').val('');
                $('#blog-pdf-url').val(''); 
                
                $('#postBlogModal').modal('show');
                $('#passkey-input').val(''); 
                $('#passkey-error').addClass('d-none');
            } else {
                $('#passkey-error').removeClass('d-none');
                $('#passkey-input').val('').focus();
            }
        });
        
        // Image preview functionality
        $('#blog-image-upload').on('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    $(this).val('');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(e) {
                    $('#image-preview').attr('src', e.target.result);
                    $('#image-preview-container').show();
                };
                reader.readAsDataURL(file);
            } else {
                $('#image-preview-container').hide();
            }
        });
        
        // Remove image button
        $('#remove-image-btn').click(function() {
            $('#blog-image-upload').val('');
            $('#image-preview').attr('src', '');
            $('#image-preview-container').hide();
        });
        
        $('#passkey-input').on('keypress', function(e) {
            if (e.which === 13) {
                $('#verify-passkey-btn').click();
            }
        });
        
        // --- Blog Submission Logic with Image Upload ---
        
        $('#submit-post-btn').click(async function () {
            const title = $('#blog-title').val().trim();
            const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
            const publishedAt = $('#blog-date').val() ? new Date($('#blog-date').val()).toISOString() : new Date().toISOString();
            const body = $('#blog-body').val().trim();
            const googleDriveUrl = $('#blog-pdf-url').val().trim();
            const imageFile = $('#blog-image-upload')[0].files[0];
            
            if (!title || !body) {
                alert("Title and Content are required.");
                return;
            }
            
            // Disable submit button and show loading
            const submitBtn = $(this);
            const originalText = submitBtn.html();
            submitBtn.prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Uploading...');
            
            try {
                let imageAssetRef = null;
                
                // Upload image to Sanity if file is selected
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('image', imageFile);
                    
                    try {
                        const uploadRes = await fetch('http://localhost:5100/api/uploadImage', {
                            method: 'POST',
                            body: formData
                            // Don't set Content-Type header - browser will set it with boundary
                        });
                        
                        if (!uploadRes.ok) {
                            let errorText;
                            try {
                                const errorJson = await uploadRes.json();
                                errorText = errorJson.error || JSON.stringify(errorJson);
                            } catch {
                                errorText = await uploadRes.text();
                            }
                            throw new Error('Image upload failed: ' + errorText);
                        }
                        
                        const uploadData = await uploadRes.json();
                        if (!uploadData.assetId) {
                            throw new Error('No asset ID returned from server');
                        }
                        imageAssetRef = uploadData.assetId;
                    } catch (err) {
                        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                            throw new Error('Cannot connect to server. Please make sure the server is running on http://localhost:5100');
                        }
                        throw err;
                    }
                }
                
                // Create blog post with image reference
                const createRes = await fetch('http://localhost:5100/api/createBlog', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        title, 
                        slug, 
                        publishedAt, 
                        imageAssetRef, 
                        body, 
                        googleDriveUrl 
                    }) 
                });
                
                if (!createRes.ok) {
                    const errorText = await createRes.text();
                    throw new Error('Blog creation failed: ' + errorText);
                }
                
                const data = await createRes.json();
                alert('Blog posted successfully!');
                $('#postBlogModal').modal('hide');
                
                // Reset form
                $('#blog-title').val('');
                $('#blog-date').val(new Date().toISOString().substring(0, 10));
                $('#blog-image-upload').val('');
                $('#image-preview-container').hide();
                $('#image-preview').attr('src', '');
                $('#blog-body').val('');
                $('#blog-pdf-url').val('');
                
                fetchSanityPosts();
            } catch (err) {
                console.error('Submission Error:', err);
                alert('Error posting blog: ' + err.message);
            } finally {
                submitBtn.prop('disabled', false).html(originalText);
            }
        });
        

    });

    // Function to make links clickable in text
    function makeLinksClickable(text) {
        if (!text) return text;
        const urlPattern = /(https?:\/\/[^\s<>"']+)/gi;
        return text.replace(urlPattern, (url) => {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    }

    // --- NEW FUNCTION for Blog DETAIL Page (To be called from blog-detail.html) ---
    window.loadBlogDetailContent = function() {
        // Function to extract URL parameter
        const getUrlParameter = (name) => {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        const slug = getUrlParameter('slug');
        const container = $('#blog-content-container');
        if (!container.length) {
            console.error('Blog content container not found');
            return;
        }
        container.html('<p class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Loading blog post...</p>');

        if (!slug || slug === 'n/a') {
            container.html('<h2 class="text-danger">Post Not Found</h2><p>The requested blog post URL is invalid.</p><a href="blogs.html" class="btn btn-primary mt-3">Back to Blogs</a>');
            return;
        }

        const projectId = '8myqcpgd';
        const dataset = 'production';
        // Escape the slug for use in GROQ query
        const escapedSlug = slug.replace(/"/g, '\\"');
        const detailQuery = encodeURIComponent(`
            *[_type == "post" && slug.current == "${escapedSlug}"][0]{
                title,
                publishedAt,
                body,
                "imageUrl": image.asset->url,
                googleDriveUrl
            }
        `);
        const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${detailQuery}`;

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                const post = data.result;
                if (post) {
                    let fullBody = '';
                    if (post.body && Array.isArray(post.body)) {
                        fullBody = post.body.map(block => {
                            if (block._type === 'block') {
                                // Render text with clickable links
                                const text = block.children ? block.children.map(child => {
                                    let childText = child.text || '';
                                    // Make links clickable
                                    childText = makeLinksClickable(childText);
                                    return childText;
                                }).join('') : '';
                                return `<p>${text}</p>`;
                            }
                            return '';
                        }).join('');
                    }

                    container.html(`
                        <h1 class="display-5 mb-4 text-primary">${post.title}</h1>
                        <p class="text-muted mb-4"><i class="fas fa-calendar-alt me-2"></i>Published: ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : '—'}</p>
                        ${post.imageUrl ? `<div class="text-center mb-4"><img src="${post.imageUrl}" class="img-fluid rounded blog-detail-main-image" alt="${post.title}" onerror="this.onerror=null;this.style.display='none';"></div>` : ''}
                        
                        <div class="blog-full-body">
                            ${fullBody}
                        </div>
                        
                        <hr class="my-5">
                        <div class="text-center">
                            <a href="blogs.html" class="btn btn-primary">
                                <i class="fas fa-arrow-left me-2"></i>Back to Blogs
                            </a>
                        </div>
                    `);
                } else {
                    container.html('<h2 class="text-danger">Post Not Found</h2><p>The requested blog post does not exist.</p><a href="blogs.html" class="btn btn-primary mt-3">Back to Blogs</a>');
                }
            },
            error: function (xhr, status, error) {
                console.error('Error loading blog detail:', error);
                container.html(`<h2 class="text-danger">Error</h2><p>Failed to fetch blog post details from the server.</p><p class="text-muted">${error}</p><a href="blogs.html" class="btn btn-primary mt-3">Back to Blogs</a>`);
            }
        });
    }
    
})(jQuery);