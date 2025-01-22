export function Guidelines() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="max-w-[83ch]">
        <h1 className="pb-6 leading-[42px]">Community Guidelines</h1>

        <p>Here are some initial guidelines:</p>
        <div>
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
        <p className="pt-4">
          Full guidelines will be posted here at a later date.
        </p>
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
