export async function TermsOfUse({
  content,
  title
}: {
  content: any;
  title: any;
}) {
  return (
    <div className="flex w-full max-w-3xl flex-1 flex-col gap-2">
      <div className="ghost max-w-[83ch]">
        <h1 className="pb-2 leading-[42px]">{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
}
