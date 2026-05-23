<script lang="ts">
  import type { PageData } from "./$types";

  export let data: PageData;

  $: settings = data.settings;
  $: whatsapp =
    settings?.contact_whatsapp && settings.contact_whatsapp !== "-"
      ? settings.contact_whatsapp.replace(/\D/g, "")
      : null;
  $: email = settings?.contact_email ?? null;
  $: waUrl = whatsapp ? `https://wa.me/${whatsapp}` : null;
  $: mailUrl = email ? `mailto:${email}` : null;
  $: siteName = settings?.site_name ?? "Mokultur";

  const services = [
    {
      icon: "bi-file-earmark-text",
      title: "Press Release",
      desc: "Distribusi press release ke jaringan editorial kami yang luas.",
    },
    {
      icon: "bi-camera",
      title: "Event Coverage",
      desc: "Liputan event dari pre-event hingga pasca-event dengan foto dan artikel.",
    },
    {
      icon: "bi-handshake",
      title: "Paid Partnership",
      desc: "Kolaborasi berbayar untuk brand yang ingin menjangkau audiens kami.",
    },
    {
      icon: "bi-megaphone",
      title: "Campaign Amplification",
      desc: "Amplifikasi kampanye melalui konten organik dan editorial.",
    },
  ];

  const trustPoints = [
    {
      title: "Audience yang spesifik",
      desc: "Pembaca kami adalah pecinta budaya pop, anime, dan teknologi yang aktif.",
    },
    {
      title: "Nada editorial yang rapi",
      desc: "Konten kami selalu terkurasi dan sesuai dengan standar editorial yang konsisten.",
    },
    {
      title: "Respons cepat",
      desc: "Tim kami merespons permintaan kolaborasi dalam 1-2 hari kerja.",
    },
  ];

  const stats = [
    { label: "Bio-links", desc: "dari dashboard" },
    { label: "1-2 hari", desc: "respons kerja" },
    { label: "Diskusi", desc: "lanjut bersama" },
  ];

  function imgFallback(e: Event) {
    (e.target as HTMLImageElement).src = "/images/noimage.png";
  }

  function timeAgo(d: string | null): string {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Hari ini";
    if (days === 1) return "Kemarin";
    if (days < 7) return `${days} hari lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
</script>

<svelte:head>
  <title>Kontak & Kolaborasi — {siteName}</title>
  <meta
    name="description"
    content="Hubungi {siteName} untuk kolaborasi konten, press release, event coverage, dan paid partnership."
  />
  <link rel="canonical" href="/contact" />
</svelte:head>

<div class="contact-hub section-md container-xl">
  <!-- Hero -->
  <div class="contact-hub__hero mb-4">
    <div class="row g-4 align-items-center">
      <div class="col-12 col-lg-7">
        <span class="badge badge-main mb-3">Contact Hub</span>
        <h1 class="contact-hub__title mb-2">Kolaborasi dengan {siteName}</h1>
        <p class="contact-hub__description mb-4">
          Dari press release sampai event coverage, kami siap bantu mengemas
          kolaborasi yang tepat sasaran dan berkesan.
        </p>
        <div class="d-flex flex-wrap gap-2">
          {#if waUrl}
            <a
              href={waUrl}
              class="theme-btn theme-btn--primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="bi bi-whatsapp me-2"></i>WhatsApp
            </a>
          {/if}
          {#if mailUrl}
            <a href={mailUrl} class="theme-btn theme-btn--surface">
              <i class="bi bi-envelope me-2"></i>Email Kami
            </a>
          {/if}
        </div>
      </div>
      <div class="col-12 col-lg-5">
        <div class="row g-3">
          {#each stats as s}
            <div class="col-4">
              <div class="contact-hub__hero-stat">
                <strong class="d-block">{s.label}</strong>
                <small class="text-white-50">{s.desc}</small>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Main content -->
  <div class="row g-4">
    <div class="col-12 col-lg-8">
      <!-- Bio Links -->
      {#if data.bioLinks.length > 0}
        <div class="contact-hub__section card border-0 mb-4">
          <div class="card-body p-4">
            <span class="badge badge-main mb-2">Links</span>
            <h2 class="h5 fw-bold mb-3">Bio Links</h2>
            <div class="d-flex flex-column gap-3">
              {#each data.bioLinks as link}
                <a
                  href={link.url}
                  class="contact-bio-link text-decoration-none"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div class="contact-bio-link__media">
                    {#if link.image}
                      <img
                        src={link.image}
                        alt={link.name}
                        width="40"
                        height="40"
                        style="border-radius:8px;object-fit:cover;"
                        on:error={imgFallback}
                      />
                    {:else}
                      <i class="bi bi-link-45deg fs-5"></i>
                    {/if}
                  </div>
                  <div class="flex-grow-1 min-w-0">
                    <strong class="d-block text-dark">{link.name}</strong>
                    <small class="text-muted text-truncate d-block"
                      >{link.url}</small
                    >
                  </div>
                  <i class="bi bi-chevron-right text-muted flex-shrink-0"></i>
                </a>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Services -->
      <div class="contact-hub__section card border-0 mb-4">
        <div class="card-body p-4">
          <span class="badge badge-main mb-2">Layanan</span>
          <h2 class="h5 fw-bold mb-3">Jenis Kolaborasi</h2>
          <div class="row g-3">
            {#each services as svc}
              <div class="col-12 col-md-6">
                <div class="contact-service-card">
                  <div
                    class="contact-service-card__icon d-inline-flex align-items-center justify-content-center mb-3"
                  >
                    <i class="bi {svc.icon}"></i>
                  </div>
                  <h3 class="h6 fw-bold mb-1">{svc.title}</h3>
                  <p class="small text-muted mb-0">{svc.desc}</p>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- Recent articles -->
      {#if data.recentArticles.length > 0}
        <div class="contact-hub__section card border-0">
          <div class="card-body p-4">
            <span class="badge badge-main mb-2">Portofolio</span>
            <h2 class="h5 fw-bold mb-3">Artikel Terbaru</h2>
            <div class="d-flex flex-column gap-3">
              {#each data.recentArticles as article}
                <a
                  href="/article/{article.id}/{article.slug}"
                  class="d-flex gap-3 align-items-start text-decoration-none"
                >
                  {#if article.image}
                    <img
                      src={article.image}
                      alt={article.title}
                      width="72"
                      height="56"
                      style="border-radius:10px;object-fit:cover;flex-shrink:0;"
                      loading="lazy"
                      on:error={imgFallback}
                    />
                  {/if}
                  <div class="min-w-0">
                    {#if article.category}
                      <span class="badge badge-main mb-1"
                        >{article.category.name}</span
                      >
                    {/if}
                    <p
                      class="fw-semibold text-dark mb-0 small lh-sm"
                      style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;"
                    >
                      {article.title}
                    </p>
                    <small class="text-muted"
                      >{timeAgo(article.publishDate)}</small
                    >
                  </div>
                </a>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="col-12 col-lg-4">
      <!-- Social Media -->
      {#if data.socials && data.socials.length > 0}
        <div class="contact-hub__section card border-0 mb-4">
          <div class="card-body p-4">
            <span class="badge badge-main mb-2">Sosial Media</span>
            <h3 class="h6 fw-bold mb-3">Temukan Kami</h3>
            <div class="contact-socials d-flex flex-column gap-2">
              {#each data.socials as s}
                <a
                  href={s.url}
                  class="contact-socials__item d-flex align-items-center gap-2 text-decoration-none text-dark"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span
                    class="contact-service-card__icon d-inline-flex align-items-center justify-content-center"
                    style="width:36px;height:36px;border-radius:10px;background:#0a0a0a;color:#f1ff32;font-size:1rem;"
                  >
                    <i class="bi bi-{s.icon ?? s.platform.toLowerCase()}"></i>
                  </span>
                  <span class="fw-semibold small">{s.platform}</span>
                </a>
              {/each}
            </div>
          </div>
        </div>
      {/if}

      <!-- Trust points -->
      <div class="contact-hub__section card border-0 mb-4">
        <div class="card-body p-4">
          <span class="badge badge-main mb-2">Kenapa Kami?</span>
          <h3 class="h6 fw-bold mb-3">Alasan Kolaborasi</h3>
          <div class="contact-trust-list d-flex flex-column gap-3">
            {#each trustPoints as tp}
              <div class="contact-trust-list__item">
                <strong class="d-flex align-items-center gap-2 mb-1 small">
                  <i
                    class="bi bi-check-circle-fill"
                    style="color:var(--site-primary,#f1ff32);"
                  ></i>
                  {tp.title}
                </strong>
                <p class="small text-muted mb-0 ps-4">{tp.desc}</p>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <!-- CTA card -->
      {#if waUrl || mailUrl}
        <div
          class="home-collab-card card border-0"
          style="background:var(--site-dark,#0a0a0a);"
        >
          <div class="card-body">
            <span class="badge badge-main mb-2">Mulai Sekarang</span>
            <h3 class="h6 fw-bold text-white mb-2">Hubungi Kami Langsung</h3>
            <p class="text-white-50 small mb-3">
              Kami merespons dalam 1-2 hari kerja.
            </p>
            <div class="d-flex flex-column gap-2">
              {#if waUrl}
                <a
                  href={waUrl}
                  class="theme-btn theme-btn--primary w-100 justify-content-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i class="bi bi-whatsapp me-2"></i>WhatsApp
                </a>
              {/if}
              {#if mailUrl}
                <a
                  href={mailUrl}
                  class="theme-btn theme-btn--surface w-100 justify-content-center"
                >
                  <i class="bi bi-envelope me-2"></i>Email
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
