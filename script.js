
// ========================================
// AFTERGLOW — ANONYMOUS COMMUNITY FORUM
// ========================================

// SUPABASE CONNECTION

const SUPABASE_URL = "https://cqmsgwwwijpszqnydebp.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_L0lU5K_mobOKaAj-V2rS7A_kR81u94H";

const db = window.supabase
  ? window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    )
  : null;


// ========================================
// ELEMENTS
// ========================================

const postList = document.getElementById("postList");
const postDialog = document.getElementById("postDialog");
const commentDialog = document.getElementById("commentDialog");
const postForm = document.getElementById("postForm");
const commentForm = document.getElementById("commentForm");
const toast = document.getElementById("toast");

let activeFilter = "All";
let activePostId = null;
let cachedPosts = [];


// ========================================
// DEMO POSTS
// ========================================

const demoPosts = [
  {
    id: "demo-1",
    title: "I thought I was supposed to feel amazing afterward",
    category: "Expectations",
    body: "I had a perfectly consensual experience, but afterward I mostly felt... neutral. Nothing bad happened. I just didn't feel the big confidence boost everyone talks about. It was reassuring to realize that maybe neutral is allowed, too.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    comments: [
      {
        body: "Neutral is absolutely a valid feeling. You don't have to turn every experience into a life lesson.",
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ]
  },
  {
    id: "demo-2",
    title: "Does anyone else need a little time to process?",
    category: "Feelings",
    body: "Sometimes I don't know how I feel until the next day. In the moment I go along with the vibe, and later I have to check in with myself. Trying to get better at listening to that instead of judging it.",
    created_at: new Date(Date.now() - 86000000).toISOString(),
    comments: []
  },
  {
    id: "demo-3",
    title: "Learning that I can change my mind",
    category: "Boundaries",
    body: "I've been practicing saying what I do and don't want without feeling like I need to make it sound casual. It's a work in progress, but it feels good to take my own boundaries seriously.",
    created_at: new Date(Date.now() - 172000000).toISOString(),
    comments: []
  }
];


// ========================================
// SECURITY: ESCAPE USER TEXT
// ========================================

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}


// ========================================
// TIME DISPLAY
// ========================================

function timeAgo(dateString) {
  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(dateString).getTime()) / 1000
    )
  );

  if (seconds < 60) return "JUST NOW";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} MIN AGO`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} HR AGO`;

  return `${Math.floor(seconds / 86400)} DAYS AGO`;
}


// ========================================
// NOTIFICATIONS
// ========================================

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}


// ========================================
// OPEN AND CLOSE POST WINDOW
// ========================================

function openPost() {
  postForm.reset();

  document.getElementById("postCount").textContent = "0";
  document.getElementById("postMessage").textContent = "";

  postDialog.showModal();
}

[
  "openPostTop",
  "openPostHero",
  "openPostForum",
  "promptPost"
].forEach(id => {
  document.getElementById(id).addEventListener("click", openPost);
});

document.getElementById("closePost").addEventListener("click", () => {
  postDialog.close();
});

document.getElementById("closeComments").addEventListener("click", () => {
  commentDialog.close();
});


// ========================================
// CHARACTER COUNTER
// ========================================

document.getElementById("postBody").addEventListener("input", event => {
  document.getElementById("postCount").textContent =
    event.target.value.length;
});


// ========================================
// MOBILE NAVIGATION
// ========================================

document.getElementById("menuToggle").addEventListener("click", () => {
  const nav = document.querySelector(".desktop-nav");

  nav.classList.toggle("open");

  document.getElementById("menuToggle").setAttribute(
    "aria-expanded",
    nav.classList.contains("open")
  );
});

document.querySelectorAll(".desktop-nav a").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector(".desktop-nav").classList.remove("open");
  });
});


// ========================================
// FILTER POSTS
// ========================================

document.querySelectorAll(".filter-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.classList.remove("active");
    });

    button.classList.add("active");
    activeFilter = button.dataset.filter;

    renderPosts();
  });
});

document.getElementById("sortSelect").addEventListener(
  "change",
  renderPosts
);


// ========================================
// GET COMMENTS
// ========================================

function getComments(post) {
  return Array.isArray(post.comments) ? post.comments : [];
}


// ========================================
// DISPLAY POSTS
// ========================================

function renderPosts() {
  const sort = document.getElementById("sortSelect").value;

  let posts = cachedPosts.filter(post => {
    return activeFilter === "All" ||
      post.category === activeFilter;
  });

  posts.sort((a, b) => {
    return sort === "newest"
      ? new Date(b.created_at) - new Date(a.created_at)
      : new Date(a.created_at) - new Date(b.created_at);
  });

  if (!posts.length) {
    postList.innerHTML = `
      <div class="empty-state">
        <strong>A little quiet in here...</strong>
        Be the first to start this conversation. ♡
      </div>
    `;
    return;
  }

  postList.innerHTML = posts.map(post => `
    <article class="post-card">
      <div class="post-meta">
        <span class="post-category">
          ${escapeHTML(post.category)}
        </span>
        <span>${timeAgo(post.created_at)}</span>
      </div>

      <h3>${escapeHTML(post.title)}</h3>

      <p class="post-body">${escapeHTML(post.body)}</p>

      <div class="post-actions">
        <span class="post-anon">♡ SHARED ANONYMOUSLY</span>

        <button
          class="comment-trigger"
          data-post-id="${escapeHTML(post.id)}"
        >
          Read & respond · ${getComments(post).length}
          ${getComments(post).length === 1 ? "comment" : "comments"} →
        </button>
      </div>
    </article>
  `).join("");

  postList.querySelectorAll(".comment-trigger").forEach(button => {
    button.addEventListener("click", () => {
      openComments(button.dataset.postId);
    });
  });
}


// ========================================
// LOAD POSTS FROM SUPABASE
// ========================================

async function loadPosts() {
  if (!db) {
    postList.innerHTML = `
      <div class="empty-state">
        <strong>Connection unavailable</strong>
        Please check the Supabase connection.
      </div>
    `;
    return;
  }

  const { data, error } = await db
    .from("posts")
    .select(`
      id,
      title,
      category,
      body,
      created_at,
      comments (
        id,
        body,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);

    postList.innerHTML = `
      <div class="empty-state">
        <strong>We couldn't load the forum.</strong>
        Please check your database setup and refresh.
      </div>
    `;
    return;
  }

  cachedPosts = data || [];
  renderPosts();
}


// ========================================
// CREATE ANONYMOUS POST
// ========================================

postForm.addEventListener("submit", async event => {
  event.preventDefault();

  const title = document.getElementById("postTitle").value.trim();
  const category = document.getElementById("postCategory").value;
  const body = document.getElementById("postBody").value.trim();
  const agreed = document.getElementById("postAgree").checked;

  if (!title || !body || !agreed) return;

  const submit = postForm.querySelector('button[type="submit"]');

  submit.disabled = true;
  submit.textContent = "Sharing...";

  const { error } = await db
    .from("posts")
    .insert({
      title,
      category,
      body
    });

  if (error) {
    console.error(error);

    document.getElementById("postMessage").textContent =
      "Your post couldn't be submitted. Please try again.";

    submit.disabled = false;
    submit.innerHTML = "Share anonymously ♡";
    return;
  }

  await loadPosts();

  postDialog.close();
  postForm.reset();

  document.getElementById("postCount").textContent = "0";

  submit.disabled = false;
  submit.innerHTML = "Share anonymously ♡";

  showToast("Your post is live. Thank you for sharing. ♡");
});


// ========================================
// OPEN COMMENTS
// ========================================

function openComments(postId) {
  activePostId = postId;

  const post = cachedPosts.find(
    post => String(post.id) === String(postId)
  );

  if (!post) return;

  document.getElementById("commentPostContent").innerHTML = `
    <div class="eyebrow">THE CONVERSATION</div>
    <h2>${escapeHTML(post.title)}</h2>
    <p class="post-body">${escapeHTML(post.body)}</p>
  `;

  renderComments(post);

  commentForm.reset();

  document.getElementById("commentMessage").textContent = "";

  commentDialog.showModal();
}


// ========================================
// DISPLAY COMMENTS
// ========================================

function renderComments(post) {
  const comments = getComments(post);
  const commentList = document.getElementById("commentList");

  if (!comments.length) {
    commentList.innerHTML = `
      <div class="empty-state">
        No responses yet.
        You can be the first to offer a little kindness. ♡
      </div>
    `;
    return;
  }

  commentList.innerHTML = comments.map(comment => `
    <div class="comment-item">
      <span>♡ ANONYMOUS · ${timeAgo(comment.created_at)}</span>
      <p>${escapeHTML(comment.body)}</p>
    </div>
  `).join("");
}


// ========================================
// CREATE ANONYMOUS COMMENT
// ========================================

commentForm.addEventListener("submit", async event => {
  event.preventDefault();

  const body = document.getElementById("commentBody").value.trim();
  const agreed = document.getElementById("commentAgree").checked;

  if (!body || !agreed) return;

  const submit = commentForm.querySelector('button[type="submit"]');

  submit.disabled = true;
  submit.textContent = "Posting...";

  const { error } = await db
    .from("comments")
    .insert({
      post_id: activePostId,
      body
    });

  if (error) {
    console.error(error);

    document.getElementById("commentMessage").textContent =
      "Your response couldn't be submitted. Please try again.";

    submit.disabled = false;
    submit.textContent = "Post anonymously ↗";
    return;
  }

  await loadPosts();

  const post = cachedPosts.find(
    post => String(post.id) === String(activePostId)
  );

  if (post) renderComments(post);

  commentForm.reset();

  submit.disabled = false;
  submit.textContent = "Post anonymously ↗";

  showToast("Your response has been shared. ♡");
});


// ========================================
// INITIALIZE WEBSITE
// ========================================

loadPosts();
