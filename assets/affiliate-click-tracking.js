(() => {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[rel~="sponsored"]');
    if (!link || typeof window.gtag !== "function") return;

    let destinationHost = "amazon";
    try {
      destinationHost = new URL(link.href).hostname;
    } catch {
      // Keep analytics non-blocking when a browser cannot parse the destination.
    }

    window.gtag("event", "affiliate_click", {
      affiliate_network: "amazon",
      destination_host: destinationHost,
      link_location: link.closest(".product-card") ? "product_card" : "article_body",
      link_text: (link.textContent || "Amazon商品リンク").trim().slice(0, 80),
      page_path: window.location.pathname,
      transport_type: "beacon",
    });
  }, { passive: true });
})();
