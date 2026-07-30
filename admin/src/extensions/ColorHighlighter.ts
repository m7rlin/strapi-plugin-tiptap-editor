import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Node as PMNode } from '@tiptap/pm/model';

const HEX_COLOR = /(#[0-9a-f]{3,6})\b/gi;

function findColors(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, position) => {
    if (!node.text) {
      return;
    }

    for (const match of node.text.matchAll(HEX_COLOR)) {
      const color = match[0];
      const from = position + (match.index ?? 0);
      decorations.push(
        Decoration.inline(from, from + color.length, {
          class: 'color',
          style: `--color: ${color}`,
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

/**
 * Decorates hex color codes in prose with a swatch chip (see the `.color`
 * rules in TiptapInputStyles). Mirror of the web renderer's ColorHighlighter
 * (apps/web/app/tiptap/color-highlighter.ts) so authors see the same chips the
 * published article shows. Decoration-only — no schema impact, hence no
 * preset key (always on, like gapcursor).
 */
export const ColorHighlighter = Extension.create({
  name: 'colorHighlighter',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        state: {
          init(_, { doc }) {
            return findColors(doc);
          },
          apply(transaction, oldState) {
            return transaction.docChanged ? findColors(transaction.doc) : oldState;
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
