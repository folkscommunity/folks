import dayjs from "dayjs";

export const current_release = "0.1.6";

const releases = [
  {
    version: "0.1.6",
    date: "2025-01-21",
    changes: [
      "You can now see who is following you and who you are following on your profile."
    ]
  },
  {
    version: "0.1.5",
    date: "2025-01-20",
    changes: [
      "Added the single post view.",
      "Added replying to posts.",
      "Added likes view on posts."
    ]
  },
  {
    version: "0.1.4",
    date: "2025-01-20",
    changes: [
      "Added error reporting, hopefully this will make things easier.",
      "Changed max lengths for some fields."
    ]
  },
  {
    version: "0.1.3",
    date: "2025-01-20",
    changes: [
      "Added admin tooling.",
      "Added email verification.",
      "Added post deletion."
    ]
  },
  {
    version: "0.1.2",
    date: "2025-01-20",
    changes: [
      "Fixed a local storage issues for feed selection.",
      "Added feed loading skeletons.",
      "Added ribbon caching.",
      "Added a media cdn with caching."
    ]
  },
  {
    version: "0.1.1",
    date: "2025-01-20",
    changes: [
      "Create a temporary production deployment workflow.",
      "Added login rate api limiting."
    ]
  }
];

export function ReleaseNotes() {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2 pb-10">
      <div className="max-w-[83ch]">
        <h2 className="pb-8">Release Notes</h2>
        <div className="flex flex-col gap-4">
          {releases.map((release, i) => (
            <div key={i} className="flex flex-col">
              <span className="font-bold opacity-75">
                Release {release.version}
              </span>
              <span className="pb-1 opacity-60">
                {dayjs(release.date).format("MMM D, YYYY")}
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
    </div>
  );
}
