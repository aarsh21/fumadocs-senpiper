import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Sparkles } from "lucide-react";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Senpiper Internal Docs",
    },
    links: [
      {
        icon: <Sparkles />,
        text: "AI Form Builder",
        url: "/ai-form-helper",
      },
    ],
    githubUrl:
      "https://bitbucket.org/senpiper/kmmruntime/src/main/documentation/",
  };
}
