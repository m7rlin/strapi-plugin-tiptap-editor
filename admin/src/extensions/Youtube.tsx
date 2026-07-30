import React, { useState } from 'react';
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, NodeViewProps } from '@tiptap/react';
import { Box, Button, Dialog, Field, Flex, IconButton, TextInput, Typography } from '@strapi/design-system';
import { Trash } from '@strapi/icons';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

/**
 * YouTube embed block. Node name/attrs mirror the web renderer's YoutubeFacade
 * (apps/web/app/tiptap/youtube.ts) — schema-affecting changes must be made on
 * both sides.
 */

export const YOUTUBE_NODE_NAME = 'youtube';

/** Extracts the 11-char video id from watch/shorts/embed/youtu.be URL shapes. */
export function getYoutubeVideoId(url: string): string | null {
  const match = url.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube-nocookie\.com|youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))((?:\w|-){11})(?:\S+)?$/
  );
  return match ? (match[1] ?? null) : null;
}

const YoutubeNodeView: React.FC<NodeViewProps> = ({ node, deleteNode, editor }) => {
  const { formatMessage } = useIntl();
  const src = typeof node.attrs.src === 'string' ? node.attrs.src : '';
  const videoId = getYoutubeVideoId(src);

  return (
    <NodeViewWrapper>
      <Box
        borderColor="neutral200"
        borderStyle="solid"
        borderWidth="1px"
        hasRadius
        padding={2}
        marginTop={2}
        marginBottom={2}
        style={{ position: 'relative', maxWidth: '480px' }}
        contentEditable={false}
      >
        {videoId ? (
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            style={{ display: 'block', width: '100%', borderRadius: '4px' }}
            draggable={false}
          />
        ) : (
          <Typography variant="pi" textColor="danger600">
            {formatMessage({
              id: 'tiptap-editor.youtube.invalidUrl',
              defaultMessage: 'Invalid YouTube URL',
            })}
          </Typography>
        )}
        <Flex justifyContent="space-between" alignItems="center" marginTop={1} gap={2}>
          <Typography variant="pi" textColor="neutral600" ellipsis>
            {src}
          </Typography>
          {editor.isEditable && (
            <IconButton
              label={formatMessage({
                id: 'tiptap-editor.youtube.remove',
                defaultMessage: 'Remove video',
              })}
              onClick={() => deleteNode()}
            >
              <Trash />
            </IconButton>
          )}
        </Flex>
      </Box>
    </NodeViewWrapper>
  );
};

export const YoutubeEmbed = Node.create({
  name: YOUTUBE_NODE_NAME,
  group: 'block',
  atom: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      start: { default: 0 },
      width: { default: 640 },
      height: { default: 480 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-youtube-video] iframe' }];
  },

  renderHTML({ HTMLAttributes }) {
    // Serialized markup (clipboard/drag, HTML export) frames the nocookie
    // embed URL — never the raw watch page. Stored JSON keeps the original src.
    const videoId = typeof HTMLAttributes.src === 'string' ? getYoutubeVideoId(HTMLAttributes.src) : null;
    const src = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : HTMLAttributes.src;
    return ['div', { 'data-youtube-video': '' }, ['iframe', mergeAttributes(HTMLAttributes, { src })]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView);
  },
});

const YoutubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M10 9.5v5l4.5-2.5L10 9.5Z" fill="currentColor" />
  </svg>
);

export function useYoutube(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const { formatMessage } = useIntl();
  const [showDialog, setShowDialog] = useState(false);
  const [url, setUrl] = useState('');

  const openDialog = () => {
    setUrl('');
    setShowDialog(true);
  };

  const insert = () => {
    if (!editor) return;
    const trimmed = url.trim();
    if (!getYoutubeVideoId(trimmed)) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: YOUTUBE_NODE_NAME, attrs: { src: trimmed } })
      .createParagraphNear()
      .run();
    setShowDialog(false);
  };

  const isValid = getYoutubeVideoId(url.trim()) !== null;

  return {
    youtubeButton: (
      <ToolbarButton
        onClick={openDialog}
        icon={<YoutubeIcon />}
        disabled={props.disabled || !editor}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.youtube',
          defaultMessage: 'Insert YouTube video',
        })}
      />
    ),
    youtubeDialog: (
      <Dialog.Root
        open={showDialog}
        onOpenChange={(open: boolean) => {
          if (!open) setShowDialog(false);
        }}
      >
        {showDialog && (
          <Dialog.Content>
            <Dialog.Header>
              {formatMessage({
                id: 'tiptap-editor.youtube.dialogTitle',
                defaultMessage: 'Insert YouTube video',
              })}
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root width="100%">
                <Field.Label>
                  {formatMessage({
                    id: 'tiptap-editor.youtube.urlLabel',
                    defaultMessage: 'Video URL',
                  })}
                </Field.Label>
                <TextInput
                  name="youtube-url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.Cancel>
                <Button variant="tertiary" fullWidth onClick={() => setShowDialog(false)}>
                  {formatMessage({ id: 'tiptap-editor.youtube.cancel', defaultMessage: 'Cancel' })}
                </Button>
              </Dialog.Cancel>
              <Dialog.Action>
                <Button fullWidth variant="success-light" onClick={insert} disabled={!isValid}>
                  {formatMessage({ id: 'tiptap-editor.youtube.insert', defaultMessage: 'Insert' })}
                </Button>
              </Dialog.Action>
            </Dialog.Footer>
          </Dialog.Content>
        )}
      </Dialog.Root>
    ),
  };
}
