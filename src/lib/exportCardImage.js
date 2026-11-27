import { toPng } from 'html-to-image';
import { CARD_STYLE_KEYS } from '../context/CardContext';

// The 4 ID-card styles are designed at a fixed 856x540 canvas (10px/mm of an
// 85.6x54mm card). Rather than resizing the DOM node to that size (which
// would blow up its box while its internal font/padding values stay put),
// capture it at its natural on-screen layout and pick a pixelRatio that
// scales the whole raster up/down to exactly that resolution.
const CARD_EXPORT_WIDTH = 856;

export async function exportCardAsImage(wrapperNode, style, filename) {
  if (!wrapperNode) return;

  const isFixedCard = CARD_STYLE_KEYS.includes(style);
  // For fixed-size cards, target just the card box itself (the infographic's
  // first child), not the supplementary info panel appended below it.
  const target = isFixedCard ? wrapperNode.firstElementChild?.firstElementChild || wrapperNode : wrapperNode;

  const pixelRatio = isFixedCard ? CARD_EXPORT_WIDTH / target.getBoundingClientRect().width : 2;

  const dataUrl = await toPng(target, { pixelRatio });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
