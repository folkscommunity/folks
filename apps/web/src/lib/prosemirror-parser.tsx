export function parseArticleHTML(html: string) {
  let parsedHTML = html;

  parsedHTML = parsedHTML.replace(/<img[^>]+>/g, (match: any) => {
    const imgTag = match.match(/<img[^>]+>/)[0];
    const src = imgTag.match(/src="([^"]+)"/)[1];
    const width = imgTag.match(/width="([^"]+)"/)[1] || "100%";
    const align = imgTag.match(/align="([^"]+)"/)[1] || "center";
    return `<div style="display: flex; justify-content: ${align};"><img src="${src}" style="width: ${width}; object-fit: ${align}; border-radius: 12px;" /></div>`;
  });

  parsedHTML = parsedHTML.replace(/<input type="checkbox"[^>]*>/g, (match) => {
    const checked = match.includes("checked");
    return `<input type="checkbox" disabled ${checked ? "checked" : ""} />`;
  });
  parsedHTML = parsedHTML.replace(/<a[^>]+>/g, (match) => {
    const hrefMatch = match.match(/href="([^"]+)"/);
    const classMatch = match.match(/class="([^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : "";
    const className = classMatch ? classMatch[1] : "";
    return `<a target="_blank" href="${href}"${className ? ` class="${className}"` : ""}>`;
  });

  return parsedHTML;
}
