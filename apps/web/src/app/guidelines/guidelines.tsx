export function Guidelines() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="ghost max-w-[83ch]">
        <h1 className="!pb-6 leading-[42px]">Community Guidelines</h1>

        <div>
          <strong>The Basics:</strong>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>No inappropriate content.</strong>
            </li>
            <li>
              <strong>Use good judgement.</strong>
            </li>
            <li>
              <strong>No hate speech.</strong>
            </li>
            <li>
              <strong>Reject negativity.</strong>
            </li>
            <li>
              <strong>Respect others.</strong>
            </li>
            <li>
              <strong>Be yourself.</strong>
            </li>
          </ul>
        </div>

        <div>
          <strong>Creative Vibes:</strong>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Share what you're making</strong> - Work-in-progress,
              finished pieces, happy accidents welcome!
            </li>
            <li>
              <strong>Hype each other up</strong> - Celebrate wins and support
              fellow creators
            </li>
            <li>
              <strong>Give credit</strong> - Tag your inspirations and
              collaborators
            </li>
            <li>
              <strong>Help out</strong> - Share skills, ask questions, we're
              figuring it out together
            </li>
          </ul>
        </div>

        <p>
          If you have any questions please contact{" "}
          <a
            href="mailto:help@folkscommunity.com"
            className="font-bold hover:underline"
          >
            help@folkscommunity.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
