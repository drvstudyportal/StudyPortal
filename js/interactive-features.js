// Enhanced Interactive Features for Study Portal
(function($) {
    'use strict';

    // Typing Animation for Hero Text
    function initTypingAnimation() {
        const texts = [
            "India's No.1 Coaching Institute for Teaching & Leadership Exams",
            "At Study Portal, we don't just teach — we prepare educators and leaders for success.",
            "We are proud to be recognized as India's No.1 Teaching Institute."
        ];
        
        let textIndex = 0;
        let charIndex = 0;
        let isDeleting = false;
        
        function typeText() {
            const currentText = texts[textIndex];
            const speed = isDeleting ? 50 : 100;
            
            if (isDeleting) {
                $('.hero-text').text(currentText.substring(0, charIndex - 1));
                charIndex--;
            } else {
                $('.hero-text').text(currentText.substring(0, charIndex + 1));
                charIndex++;
            }
            
            if (!isDeleting && charIndex === currentText.length) {
                setTimeout(() => isDeleting = true, 2000);
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
            }
            
            setTimeout(typeText, speed);
        }
        
        // Only initialize if hero text element exists
        if ($('.hero-text').length) {
            typeText();
        }
    }

    // Particle Background Disabled - Clean background preferred
    function initParticleBackground() {
        // Particle background removed for cleaner look
        return;
    }

    // Interactive Course Filter
    function initCourseFilter() {
        const filterButtons = $('.course-filter-btn');
        const courseItems = $('.course-item');

        filterButtons.on('click', function() {
            const filter = $(this).data('filter');
            
            filterButtons.removeClass('active');
            $(this).addClass('active');
            
            courseItems.each(function() {
                const $item = $(this);
                if (filter === 'all' || $item.hasClass(filter)) {
                    $item.fadeIn(300);
                } else {
                    $item.fadeOut(300);
                }
            });
        });
    }

    // Interactive Search with Highlighting
    function initSearchHighlighting() {
        const searchInput = $('#search-input');
        const searchableElements = $('.course-item, .service-item');

        searchInput.on('input', function() {
            const searchTerm = $(this).val().toLowerCase();
            
            searchableElements.each(function() {
                const $element = $(this);
                const text = $element.text().toLowerCase();
                
                if (text.includes(searchTerm)) {
                    $element.show().addClass('search-highlight');
                } else {
                    $element.hide().removeClass('search-highlight');
                }
            });
        });
    }

    // Interactive Progress Tracking
    function initProgressTracking() {
        const progressBars = $('.progress-bar');
        
        $(window).on('scroll', function() {
            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const documentHeight = $(document).height();
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
            
            $('.scroll-progress').css('width', scrollPercent + '%');
        });
    }

    // Interactive Tooltips
    function initInteractiveTooltips() {
        $('[data-tooltip]').hover(
            function() {
                const tooltip = $('<div class="custom-tooltip">' + $(this).data('tooltip') + '</div>');
                $('body').append(tooltip);
                
                const offset = $(this).offset();
                tooltip.css({
                    position: 'absolute',
                    top: offset.top - tooltip.outerHeight() - 10,
                    left: offset.left + ($(this).outerWidth() / 2) - (tooltip.outerWidth() / 2),
                    background: '#333',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    zIndex: 9999,
                    opacity: 0
                }).animate({ opacity: 1 }, 200);
            },
            function() {
                $('.custom-tooltip').remove();
            }
        );
    }

    // Interactive Form Validation
    function initFormValidation() {
        $('form').on('submit', function(e) {
            const $form = $(this);
            let isValid = true;
            
            $form.find('[required]').each(function() {
                const $field = $(this);
                const value = $field.val().trim();
                
                if (!value) {
                    $field.addClass('error').next('.error-message').remove();
                    $field.after('<span class="error-message text-danger">This field is required</span>');
                    isValid = false;
                } else {
                    $field.removeClass('error');
                    $field.next('.error-message').remove();
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                $('html, body').animate({
                    scrollTop: $form.find('.error').first().offset().top - 100
                }, 500);
            }
        });
    }

    // Interactive Loading States
    function initLoadingStates() {
        $('.btn').on('click', function() {
            const $btn = $(this);
            const originalText = $btn.text();
            
            if (!$btn.hasClass('loading')) {
                $btn.addClass('loading')
                    .html('<span class="loading-spinner"></span> Loading...')
                    .prop('disabled', true);
                
                setTimeout(() => {
                    $btn.removeClass('loading')
                        .text(originalText)
                        .prop('disabled', false);
                }, 2000);
            }
        });
    }

    // Interactive Image Gallery
    function initImageGallery() {
        $('.gallery-item').on('click', function() {
            const src = $(this).find('img').attr('src');
            const modal = $(`
                <div class="image-modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <img src="${src}" alt="">
                    </div>
                </div>
            `);
            
            $('body').append(modal);
            modal.fadeIn(300);
            
            modal.on('click', function(e) {
                if (e.target === this || $(e.target).hasClass('close')) {
                    modal.fadeOut(300, function() {
                        modal.remove();
                    });
                }
            });
        });
    }

    // Interactive Statistics Counter
    function initStatisticsCounter() {
        const counters = $('.stat-counter');
        
        counters.each(function() {
            const $counter = $(this);
            const target = parseInt($counter.data('target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                $counter.text(Math.floor(current));
            }, 16);
        });
    }

    // Initialize all interactive features
    function initAllFeatures() {
        initTypingAnimation();
        initParticleBackground();
        initCourseFilter();
        initSearchHighlighting();
        initProgressTracking();
        initInteractiveTooltips();
        initFormValidation();
        initLoadingStates();
        initImageGallery();
        initStatisticsCounter();
    }

    // Initialize when document is ready
    $(document).ready(function() {
        initAllFeatures();
    });

})(jQuery);
