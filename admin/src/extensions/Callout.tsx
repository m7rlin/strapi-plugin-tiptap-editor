import React from 'react';
import { Editor, Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  NodeViewContent,
  ReactNodeViewRenderer,
  NodeViewProps,
  useEditorState,
} from '@tiptap/react';
import { Box, Flex, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { ToolbarButton } from '../components/ToolbarButton';

/**
 * Callout block (info / warning / tip). Node name/attrs mirror the web
 * renderer's Callout (apps/web/app/tiptap/custom-nodes.ts) — schema-affecting
 * changes must be made on both sides.
 */

export const CALLOUT_NODE_NAME = 'callout';
export const CALLOUT_VARIANTS = ['info', 'warning', 'tip'] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

const VARIANT_COLORS: Record<CalloutVariant, string> = {
  info: '#0c75af',
  warning: '#d9822f',
  tip: '#328048',
};

const CalloutNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const { formatMessage } = useIntl();
  const rawVariant = typeof node.attrs.variant === 'string' ? node.attrs.variant : 'info';
  const variant: CalloutVariant = (CALLOUT_VARIANTS as readonly string[]).includes(rawVariant)
    ? (rawVariant as CalloutVariant)
    : 'info';

  return (
    <NodeViewWrapper>
      <Box
        borderColor="neutral200"
        borderStyle="solid"
        borderWidth="1px"
        hasRadius
        padding={3}
        marginTop={2}
        marginBottom={2}
        style={{ borderInlineStart: `4px solid ${VARIANT_COLORS[variant]}` }}
      >
        {editor.isEditable && (
          <Flex justifyContent="flex-end" contentEditable={false} marginBottom={1}>
            <SingleSelect
              size="S"
              aria-label={formatMessage({
                id: 'tiptap-editor.callout.variant',
                defaultMessage: 'Callout type',
              })}
              value={variant}
              onChange={(value: string | number) => updateAttributes({ variant: String(value) })}
            >
              {CALLOUT_VARIANTS.map((entry) => (
                <SingleSelectOption key={entry} value={entry}>
                  {entry}
                </SingleSelectOption>
              ))}
            </SingleSelect>
          </Flex>
        )}
        <NodeViewContent />
      </Box>
    </NodeViewWrapper>
  );
};

export const Callout = Node.create({
  name: CALLOUT_NODE_NAME,
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addAttributes() {
    return {
      variant: { default: 'info' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': node.attrs.variant }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },
});

const CalloutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 8h.01M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export function useCallout(editor: Editor | null, props: { disabled?: boolean } = {}) {
  const { formatMessage } = useIntl();
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return { isActive: false };
      }
      return { isActive: ctx.editor.isActive(CALLOUT_NODE_NAME) ?? false };
    },
  });

  const toggle = () => {
    if (!editor) return;
    if (editorState?.isActive) {
      editor.chain().focus().lift(CALLOUT_NODE_NAME).run();
    } else {
      editor.chain().focus().wrapIn(CALLOUT_NODE_NAME, { variant: 'info' }).run();
    }
  };

  return {
    calloutButton: (
      <ToolbarButton
        onClick={toggle}
        icon={<CalloutIcon />}
        active={editorState?.isActive ?? false}
        disabled={props.disabled || !editor}
        tooltip={formatMessage({
          id: 'tiptap-editor.toolbar.callout',
          defaultMessage: 'Toggle callout',
        })}
      />
    ),
  };
}
