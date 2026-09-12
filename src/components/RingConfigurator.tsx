import { useMemo, useState, type CSSProperties } from 'react';
import { Check, Diamond } from 'lucide-react';
import RingViewer from './RingViewer';
import { resolveAsset, selectModel, type MetalId, type WidgetConfig } from '../widget/config';

interface Props {
  config: WidgetConfig;
}

const METALS: { id: MetalId; name: string; colorCode: string }[] = [
  { id: 'yellow', name: '14k Yellow Gold', colorCode: '#F9D77E' },
  { id: 'white', name: '14k White Gold', colorCode: '#F0EDE8' },
  { id: 'rose', name: '14k Rose Gold', colorCode: '#F0B49E' },
];

const SHAPES = ['round', 'oval', 'cushion', 'emerald'] as const;

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function RingConfigurator({ config }: Props) {
  const [metalColor, setMetalColor] = useState<MetalId>(config.initialMetal);
  const [diamondShape, setDiamondShape] = useState<string>('round');
  const [hasHalo, setHasHalo] = useState(config.initialHalo);
  const [hasPave, setHasPave] = useState(config.initialPave);

  const modelUrl = useMemo(
    () => resolveAsset(config.assetBase, selectModel(config.models, hasHalo, hasPave)),
    [config.assetBase, config.models, hasHalo, hasPave],
  );
  const envHdrUrl = useMemo(
    () => resolveAsset(config.assetBase, config.envHdr),
    [config.assetBase, config.envHdr],
  );
  const diamondHdrUrl = useMemo(
    () => resolveAsset(config.assetBase, config.diamondHdr),
    [config.assetBase, config.diamondHdr],
  );
  // DRACOLoader requires a trailing slash on the decoder directory.
  const dracoUrl = useMemo(() => {
    const p = resolveAsset(config.assetBase, config.dracoPath);
    return p.endsWith('/') ? p : `${p}/`;
  }, [config.assetBase, config.dracoPath]);

  const title =
    config.title ||
    `${hasPave ? 'Pavé' : 'Classic'} ${hasHalo ? 'Halo' : 'Solitaire'} Engagement Ring`;

  const price =
    config.priceBase +
    (hasHalo ? config.priceHalo : 0) +
    (hasPave ? config.pricePave : 0);

  const rootStyle = { '--rv-viewer-height': config.viewerHeight } as CSSProperties;

  const delta = (amount: number) =>
    amount > 0 ? ` (+${config.currency}${amount.toLocaleString()})` : '';

  return (
    <div className="rv-root" style={rootStyle}>
      <div className="rv-layout">
        <div className="rv-viewer">
          <RingViewer
            modelUrl={modelUrl}
            metalColor={metalColor}
            envHdrUrl={envHdrUrl}
            diamondHdrUrl={diamondHdrUrl}
            dracoUrl={dracoUrl}
          />
          <p className="rv-hint">Drag to spin &bull; Scroll to zoom</p>
        </div>

        <div className="rv-controls">
          {config.showTitle && <h2 className="rv-title">{title}</h2>}
          {config.showPrice && (
            <p className="rv-price">
              {config.currency}
              {price.toLocaleString()}
            </p>
          )}

          {config.showShapes && (
            <div className="rv-group">
              <h3 className="rv-group-title">Diamond Shape</h3>
              <p className="rv-selected">{titleCase(diamondShape)}</p>
              <div className="rv-shape-grid">
                {SHAPES.map((shape) => {
                  const available = shape === 'round';
                  return (
                    <button
                      type="button"
                      key={shape}
                      className={`rv-shape-btn${diamondShape === shape ? ' rv-active' : ''}`}
                      disabled={!available}
                      aria-pressed={diamondShape === shape}
                      onClick={() => available && setDiamondShape(shape)}
                    >
                      <span className={`rv-shape-icon rv-shape-${shape}`} />
                      <span>{titleCase(shape)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rv-group">
            <h3 className="rv-group-title">Metal Colour</h3>
            <p className="rv-selected">{METALS.find((m) => m.id === metalColor)?.name}</p>
            <div className="rv-metal-options">
              {METALS.map((metal) => (
                <button
                  type="button"
                  key={metal.id}
                  className={`rv-metal-btn${metalColor === metal.id ? ' rv-active' : ''}`}
                  onClick={() => setMetalColor(metal.id)}
                  style={{ backgroundColor: metal.colorCode }}
                  aria-label={metal.name}
                  aria-pressed={metalColor === metal.id}
                >
                  {metalColor === metal.id && (
                    <Check size={16} color={metal.id === 'white' ? '#111' : '#fff'} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rv-group">
            <h3 className="rv-group-title">Setting Style</h3>

            <div className="rv-toggle-row">
              <span className="rv-toggle-label">Centre Setting</span>
              <div className="rv-toggle-group">
                <button
                  type="button"
                  className={`rv-toggle-btn${!hasHalo ? ' rv-active' : ''}`}
                  aria-pressed={!hasHalo}
                  onClick={() => setHasHalo(false)}
                >
                  Solitaire
                </button>
                <button
                  type="button"
                  className={`rv-toggle-btn${hasHalo ? ' rv-active' : ''}`}
                  aria-pressed={hasHalo}
                  onClick={() => setHasHalo(true)}
                >
                  Halo{config.showPrice ? delta(config.priceHalo) : ''}
                </button>
              </div>
            </div>

            <div className="rv-toggle-row">
              <span className="rv-toggle-label">Band Style</span>
              <div className="rv-toggle-group">
                <button
                  type="button"
                  className={`rv-toggle-btn${!hasPave ? ' rv-active' : ''}`}
                  aria-pressed={!hasPave}
                  onClick={() => setHasPave(false)}
                >
                  Plain
                </button>
                <button
                  type="button"
                  className={`rv-toggle-btn${hasPave ? ' rv-active' : ''}`}
                  aria-pressed={hasPave}
                  onClick={() => setHasPave(true)}
                >
                  Pavé{config.showPrice ? delta(config.pricePave) : ''}
                </button>
              </div>
            </div>
          </div>

          {config.showCta && (
            <button type="button" className="rv-cta">
              <Diamond size={18} /> {config.ctaLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
