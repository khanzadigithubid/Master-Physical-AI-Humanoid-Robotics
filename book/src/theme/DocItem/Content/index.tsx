import React from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type {WrapperProps} from '@docusaurus/types';
import ChapterControls from '@site/src/components/ChapterControls';
import ChapterContent from '@site/src/components/ChapterContent';
import { useDoc } from '@docusaurus/plugin-content-docs/client';

type Props = WrapperProps<typeof ContentType>;

export default function ContentWrapper(props: Props): React.JSX.Element {
  let metadata;
  try {
    const docContext = useDoc();
    metadata = docContext.metadata;
  } catch (e) {
    metadata = { id: 'unknown' };
  }

  return (
    <>
      <ChapterControls chapterId={metadata.id} />
      <ChapterContent originalContent={<Content {...props} />} />
    </>
  );
}
