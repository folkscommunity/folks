import Link from "next/link";

export function Manifesto({
  user,
  content,
  title
}: {
  user?: any;
  content: any;
  title: any;
}) {
  return (
    <div className="flex min-h-[80dvh] w-full max-w-3xl flex-col gap-2">
      <div className="ghost max-w-[83ch]">
        <h1 className="pb-2 leading-[42px]">{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />

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
