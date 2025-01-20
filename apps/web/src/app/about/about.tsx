import Link from "next/link";

import { Photo } from "./about-photo";

export function About() {
  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-col gap-2">
      <div className="max-w-[83ch]">
        <h2 className="pb-4">About Folks</h2>
        <p className="pt-4">
          Folks is a place for <strong>product people</strong>{" "}
          <span className="opacity-80">
            (designers, engineers, founders, painters, carpenters, and anyone
            else who crafts something)
          </span>{" "}
          to share their creations and thoughts with each other and feel
          comfortable doing so.
        </p>
        <p>
          For me, posts.cv was the first platform that I actually finally felt
          comfortable to just post things, I really want everyone else to have
          that experience.
        </p>
        <div>
          Design & vibe-wise, I loved what Allan created with Good News. I want
          to somehow embody that and pay homage to it without it being a direct
          clone. I want to include the Stickers <Photo /> and the Ribbon with
          scrolling statuses from all the members.
        </div>
        <p className="pt-4">
          I plan to support this platform long-term by hosting it and managing
          the open-source repository. Since it is open-source, if for any reason
          I'm unable to support it anymore, it will be easy for someone else to
          take over the baton.
        </p>
        <strong>Contributing</strong>
        <p className="pt-4">
          The code for this platform is open-source, if you-re interested in
          adding features or fixing bugs yourself, you can find it on{" "}
          <a
            href="https://github.com/folkscommunity/folks"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub
          </a>
          . Otherwise feel free to create a post on here with the{" "}
          <Link href="">#feedback</Link> tag.
        </p>
        <p className="pt-8">Let's build something together, that will last.</p>
        <pre className="font-ansi text-ansi leading-ansi pt-4">{`      ╭╮  ╭╮
      ┃┃  ┃┃
      ┃┣━━┫╰━┳━╮╭╮ ╭╮
╭━━╮╭╮┃┃╭╮┃╭╮┃╭╮┫┃ ┃┃
╰━━╯┃╰╯┃╰╯┃┃┃┃┃┃┃╰━╯┃
    ╰━━┻━━┻╯╰┻╯╰┻━╮╭╯
                ╭━╯┃
                ╰━━╯`}</pre>
      </div>
    </div>
  );
}
