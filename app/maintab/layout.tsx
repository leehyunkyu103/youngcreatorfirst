import type { Metadata } from "next";
import MainTabShell from "./MainTabShell";

export const metadata: Metadata = {
  title: "삼성증권 VVIP 지능형 입력부",
  description: "VVIP 고객 상담을 위한 재무 정보 및 RRTTLLU 입력 화면",
};

export default function MaintabLayout({ children }: { children: React.ReactNode }) {
  return <MainTabShell>{children}</MainTabShell>;
}
