import ColorfulInfographic from './ColorfulInfographic';
import MinimalInfographic from './MinimalInfographic';
import GameStatInfographic from './GameStatInfographic';
import ScrapbookInfographic from './ScrapbookInfographic';
import SparkleInfographic from './SparkleInfographic';
import BrowserInfographic from './BrowserInfographic';
import VintageInfographic from './VintageInfographic';
import NeonInfographic from './NeonInfographic';
import RepublicInfographic from './RepublicInfographic';
import CivicPassInfographic from './CivicPassInfographic';
import TechPassInfographic from './TechPassInfographic';

const RENDERERS = {
  colorful: ColorfulInfographic,
  minimal: MinimalInfographic,
  gamestat: GameStatInfographic,
  scrapbook: ScrapbookInfographic,
  sparkle: SparkleInfographic,
  browser: BrowserInfographic,
  vintage: VintageInfographic,
  neon: NeonInfographic,
  republic: RepublicInfographic,
  civicpass: CivicPassInfographic,
  techpass: TechPassInfographic,
};

export default function InfographicRenderer({ card }) {
  const Renderer = RENDERERS[card.style] || ColorfulInfographic;
  return <Renderer card={card} />;
}
