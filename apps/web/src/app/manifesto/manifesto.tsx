import Link from "next/link";

export function Manifesto({ user }: { user?: any }) {
  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-col gap-2">
      <div className="ghost max-w-[83ch]">
        <h1 className="pb-2 leading-[42px]">The Manifesto</h1>

        <p>
          Folks is a place for <strong>creative people</strong>{" "}
          <span className="italic">
            (designers, engineers, founders, painters, carpenters, architects,
            lighting designers and anyone else who creates something)
          </span>{" "}
          to share their creations and thoughts with each other and feel
          comfortable doing so.
        </p>

        <p>
          I want this platform to be a place where you're comfortable to share
          your creations, ask questions, and talk with the community.
        </p>

        <p>
          I plan to support this platform long-term by financing hosting,
          moderating and by managing the open-source repository. Since it is
          open-source, if for any reason I'm unable to support it anymore, it
          will be possible for someone else to take over the baton.
        </p>

        <strong>Contributing Code</strong>

        <p>
          The code for this platform is open-source, if you-re interested in
          adding features or fixing bugs yourself, you can find it on{" "}
          <a href="https://github.com/folkscommunity/folks">GitHub</a>.
          Otherwise feel free to use the form on the{" "}
          <a href="https://folkscommunity.com/support">/support</a> page.
        </p>

        <p>Let's build something together, that will last.</p>

        <pre className="font-ansi text-ansi leading-ansi pt-4">{`      ╭╮  ╭╮
      ┃┃  ┃┃
      ┃┣━━┫╰━┳━╮╭╮ ╭╮
╭━━╮╭╮┃┃╭╮┃╭╮┃╭╮┫┃ ┃┃
╰━━╯┃╰╯┃╰╯┃┃┃┃┃┃┃╰━╯┃
    ╰━━┻━━┻╯╰┻╯╰┻━╮╭╯
                ╭━╯┃
                ╰━━╯`}</pre>

        {!user && (
          <p className="mt-8">
            Join the community by{" "}
            <Link href="/register" className="font-bold underline">
              click here
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
