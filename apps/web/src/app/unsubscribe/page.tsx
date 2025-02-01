import { MainContainer } from "@/components/main-container";

import { Unsubscribe } from "./[email]/unsubscribe";

export default async function Page() {
  return (
    <MainContainer>
      <Unsubscribe />
    </MainContainer>
  );
}
