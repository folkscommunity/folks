import Autolinker from "autolinker";
import sanitize from "sanitize-html";

function parsePostBody(text: string): string {
  // autolink urls
  text = Autolinker.link(text, {
    className: "text-sky-600 hover:underline cursor-pointer",
    stripPrefix: true,
    stripTrailingSlash: true,
    newWindow: true
  });

  text = text.replace(/(?:^|[.,]|\s)@(\w+)(?![^<]*>)/g, (match, username) => {
    const prefix = match.charAt(0) === "@" ? "" : match.charAt(0);
    return `${prefix}<a href="/${username}" class="text-sky-600 hover:underline cursor-pointer inline">@${username}</a>`;
  });

  // sanitize html
  text = sanitize(text, {
    allowedTags: ["a"],
    allowedAttributes: {
      a: ["href", "class", "target", "rel"]
    }
  });

  // new lines
  text = text.replace(/\n/g, "<br />");

  // bold text ** text **
  text = text.replace(/\*\*(.*?)\*\*/g, (match, text) => {
    return `<b>${text}</b>`;
  });

  // italic text * text *
  text = text.replace(/\*(.*?)\*/g, (match, text) => {
    return `<i>${text}</i>`;
  });

  return text;
}

export { parsePostBody };
