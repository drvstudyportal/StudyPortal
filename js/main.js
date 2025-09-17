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
                <div class="card mb-3 p-4">
                  <h3 class="card-title" style="color:#fb873f;">${post.title}</h3>
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
      const enteredKey = prompt("Enter passkey to post a blog:");
      if (enteredKey === SECRET_PASSKEY) {
        $('#postBlogModal').css('display', 'flex');
      } else {
        alert("Access denied. Invalid passkey.");
      }
    });

    $('#close-modal-btn').click(function () {
      $('#postBlogModal').hide();
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
        $('#postBlogModal').hide();
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
    
})(jQuery);