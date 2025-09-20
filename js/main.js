(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
      setTimeout(function () {
          if ($('#spinner').length > 0) {
              $('#spinner').removeClass('show');
          }
      }, 1);
  };
  spinner();

  $(document).ready(function () {
    const SECRET_PASSKEY = 'qwerty'; // Your passkey

    function fetchSanityPosts() {
      const projectId = '8myqcpgd';
      const dataset = 'production';
      const query = encodeURIComponent(`
        *[_type == "post"]|order(publishedAt desc){
          title,
          slug,
          publishedAt,
          body,
          "imageUrl": image.asset->url
        }
      `);
      const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${query}`;
      $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
          if (data.result && data.result.length) {
            let postsHtml = '';
            data.result.forEach(post => {
              let bodyText = '';
              if (post.body && Array.isArray(post.body)) {
                bodyText = post.body.map(block => block.children ? block.children.map(child => child.text).join('') : '').join('<br>');
              }
              postsHtml += `
                <div class="card blog-card mb-3 p-4">
                  <h3 class="card-title" style="color:var(--primary);">${post.title}</h3>
                  ${post.imageUrl ? `<img src="${post.imageUrl}" class="img-fluid mb-2" style="max-height:200px;object-fit:cover;">` : ''}
                  <div class="card-text">${bodyText}</div>
                  <small class="text-muted">Published: ${post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "—"}</small>
                </div>`;
            });
            $('#sanity-blog-posts').html(postsHtml);
          } else {
            $('#sanity-blog-posts').html('<p>No blog posts found.</p>');
          }
        },
        error: function (xhr, status, error) {
          $('#sanity-blog-posts').html(`<p>Error loading posts: ${error}</p>`);
        }
      });
    }

    fetchSanityPosts();

    $('#post-blog-btn').click(function () {
      $('#passkeyModal').modal('show');
    });

    $('#verify-passkey-btn').click(function () {
      const enteredKey = $('#passkey-input').val();
      if (enteredKey === SECRET_PASSKEY) {
        $('#passkeyModal').modal('hide');
        $('#postBlogModal').modal('show');
        $('#passkey-input').val('');
        $('#passkey-error').addClass('d-none');
      } else {
        $('#passkey-error').removeClass('d-none');
        $('#passkey-input').val('').focus();
      }
    });

    $('#passkey-input').on('keypress', function(e) {
      if (e.which === 13) {
        $('#verify-passkey-btn').click();
      }
    });

    $('#close-modal-btn').click(function () {
      $('#postBlogModal').modal('hide');
    });

    $('#submit-post-btn').click(function () {
      const title = $('#blog-title').val().trim();
      const slug = $('#blog-slug').val().trim() || title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
      const publishedAt = $('#blog-date').val() ? new Date($('#blog-date').val()).toISOString() : new Date().toISOString();
      const imageUrl = $('#blog-imageurl').val().trim();
      const body = $('#blog-body').val().trim();

      if (!title || !body) {
        alert("Title and Body are required.");
        return;
      }

      fetch('http://localhost:5100/api/createBlog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, publishedAt, imageUrl, body })
      })
      .then(res => {
        if (res.ok) return res.json();
        else return res.text().then(text => Promise.reject(text));
      })
      .then(data => {
        alert('Blog posted successfully!');
        $('#postBlogModal').modal('hide');
        fetchSanityPosts();
      })
      .catch(err => {
        alert('Error posting blog: ' + err);
      });
    });
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


    // Header-carousel
    $(".header-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        items: 1,
        dots: false,
        loop: true,
        nav : true,
        navText : [
            '<i class="bi bi-chevron-left"></i>',
            '<i class="bi bi-chevron-right"></i>'
        ]
    });


    // Testimonials carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1000,
        center: true,
        margin: 24,
        dots: true,
        loop: true,
        nav : false,
        responsive: {
            0:{
                items:1
            },
            768:{
                items:2
            },
            992:{
                items:3
            }
        }
    });

    // Interactive Counter Animation
    function animateCounters() {
        $('.counter').each(function() {
            const $this = $(this);
            const countTo = $this.attr('data-count');
            
            $({ countNum: $this.text() }).animate({
                countNum: countTo
            }, {
                duration: 2000,
                easing: 'swing',
                step: function() {
                    $this.text(Math.floor(this.countNum));
                },
                complete: function() {
                    $this.text(this.countNum);
                }
            });
        });
    }

    // Scroll Animation Observer
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    
                    // Trigger counter animation if element has counter
                    if (entry.target.querySelector('.counter')) {
                        animateCounters();
                    }
                }
            });
        }, observerOptions);

        // Observe all elements with scroll-animate class
        document.querySelectorAll('.scroll-animate').forEach(el => {
            observer.observe(el);
        });
    }

    // Interactive Progress Bars
    function initProgressBars() {
        $('.progress-bar').each(function() {
            const $this = $(this);
            const width = $this.data('width') || 0;
            
            setTimeout(() => {
                $this.css('width', width + '%');
            }, 500);
        });
    }

    // Enhanced Course Card Interactions
    function initCourseInteractions() {
        $('.course-item').hover(
            function() {
                $(this).find('.image img').css('transform', 'scale(1.1)');
            },
            function() {
                $(this).find('.image img').css('transform', 'scale(1)');
            }
        );

        // Add click ripple effect
        $('.course-item').on('click', function(e) {
            const $this = $(this);
            const ripple = $('<span class="ripple"></span>');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.css({
                width: size,
                height: size,
                left: x,
                top: y
            });
            
            $this.append(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    // Interactive FAQ Enhancement
    function initFAQInteractions() {
        $('.accordion-button').on('click', function() {
            const $this = $(this);
            const $collapse = $($this.data('bs-target'));
            
            // Add smooth animation
            $collapse.on('show.bs.collapse', function() {
                $(this).css('height', '0px').animate({
                    height: $(this)[0].scrollHeight + 'px'
                }, 300);
            });
            
            $collapse.on('hide.bs.collapse', function() {
                $(this).animate({
                    height: '0px'
                }, 300);
            });
        });
    }

    // Floating Action Button Interactions
    function initFloatingButtons() {
        $('.floating-whatsapp, .floating-youtube').hover(
            function() {
                $(this).addClass('pulse-animation');
            },
            function() {
                $(this).removeClass('pulse-animation');
            }
        );
    }

    // Interactive Navigation Enhancement
    function initNavigationInteractions() {
        // Smooth scroll for anchor links
        $('a[href^="#"]').on('click', function(e) {
            e.preventDefault();
            const target = $(this.getAttribute('href'));
            if (target.length) {
                $('html, body').animate({
                    scrollTop: target.offset().top - 80
                }, 1000, 'easeInOutExpo');
            }
        });

        // Active navigation highlighting
        $(window).on('scroll', function() {
            const scrollPos = $(window).scrollTop() + 100;
            
            $('.navbar-nav .nav-link').each(function() {
                const href = $(this).attr('href');
                if (href && href.startsWith('#')) {
                    const target = $(href);
                    if (target.length && target.offset().top <= scrollPos && target.offset().top + target.outerHeight() > scrollPos) {
                        $('.navbar-nav .nav-link').removeClass('active');
                        $(this).addClass('active');
                    }
                }
            });
        });
    }

    // Loading States and Micro-interactions
    function initLoadingStates() {
        // Add loading state to buttons
        $('.btn').on('click', function() {
            const $this = $(this);
            const originalText = $this.text();
            
            $this.html('<span class="loading-spinner"></span> Loading...');
            
            setTimeout(() => {
                $this.text(originalText);
            }, 2000);
        });
    }

    // Parallax Effect for Hero Section
    function initParallaxEffect() {
        $(window).on('scroll', function() {
            const scrolled = $(window).scrollTop();
            const parallax = $('.header-carousel');
            const speed = scrolled * 0.5;
            
            parallax.css('transform', 'translateY(' + speed + 'px)');
        });
    }

    // Interactive Service Items
    function initServiceInteractions() {
        $('.service-item').on('mouseenter', function() {
            $(this).addClass('pulse-animation');
        }).on('mouseleave', function() {
            $(this).removeClass('pulse-animation');
        });
    }

    // Initialize all interactive features
    function initInteractiveFeatures() {
        initScrollAnimations();
        initProgressBars();
        initCourseInteractions();
        initFAQInteractions();
        initFloatingButtons();
        initNavigationInteractions();
        initLoadingStates();
        initParallaxEffect();
        initServiceInteractions();
    }

    // Call initialization
    initInteractiveFeatures();

    // Add CSS for ripple effect
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `)
        .appendTo('head');
    
})(jQuery);