import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Senpiper Internal Docs",
    },
    githubUrl:
      "https://bitbucket.org/senpiper/kmmruntime/src/main/documentation/",
  };
}
