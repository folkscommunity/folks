import Autolinker from "autolinker";
import sanitize from "sanitize-html";

function parsePostBody(text: string): string {
  // match @ mentions
  text = text.replace(/@(\w+)/g, (match, username) => {
    return `<a href="/${username}" class="text-sky-600 hover:underline cursor-pointer inline">@${username}</a>`;
  });

  // autolink urls
  text = Autolinker.link(text, {
    className: "text-sky-600 hover:underline cursor-pointer",
    stripPrefix: false,
    stripTrailingSlash: false,
    newWindow: true
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
