import Link from "next/link";

export const current_release = "0.1.4";

const releases = [
  {
    version: "0.1.4",
    changes: ["added error reporting", "changed max lengths for some fields"]
  },
  {
    version: "0.1.3",
    changes: [
      "added admin tools",
      "added email verification",
      "added post deletion"
    ]
  },
  {
    version: "0.1.2",
    changes: [
      "fixed a local storage issues for feed selection",
      "added loading skeletons",
      "added ribbon caching",
      "added a media cdn with caching"
    ]
  },
  {
    version: "0.1.1",
    changes: [
      "create a temporary production deployment workflow",
      "added login rate limiting"
    ]
  }
];

export function ReleaseNotes() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 pb-10">
      <div className="max-w-[83ch]">
        <h2 className="pb-8">Release Notes</h2>
        {releases.map((release, i) => (
          <div key={i}>
            <span className="pb-2 font-bold opacity-75">
              v{release.version}
            </span>
            <ul className="pl-4">
              {release.changes.map((change, i) => (
                <li key={i}>– {change}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
