import { useState } from 'react';
import RingViewer from './components/RingViewer';
import { Diamond, Check, ChevronRight, Star } from 'lucide-react';

function App() {
  const [metalColor, setMetalColor] = useState('yellow'); // yellow, white, rose
  const [diamondShape, setDiamondShape] = useState('round');
  const [hasHalo, setHasHalo] = useState(false);
  const [hasPave, setHasPave] = useState(false);

  const getModelFile = () => {
    if (!hasHalo && !hasPave) return 'Rhino File (18).glb'; // Solitaire Plain
    if (!hasHalo && hasPave) return 'Rhino File (17).glb'; // Solitaire Pave
    if (hasHalo && !hasPave) return 'Rhino File.glb'; // Halo Plain
    if (hasHalo && hasPave) return 'Main File.glb'; // Halo Pave
    return 'Rhino File (18).glb';
  };

  const getPrice = () => {
    let base = 980; // Solitaire
    if (hasHalo) base += 350;
    if (hasPave) base += 450;
    return `$${base.toLocaleString()}`;
  };

  const getTitle = () => {
    const head = hasHalo ? 'Halo' : 'Solitaire';
    const band = hasPave ? 'Pavé' : 'Classic';
    return `${band} ${head} Engagement Ring`;
  };

  const metals = [
    { id: 'yellow', name: '14k Yellow Gold', colorCode: '#F9D77E' },
    { id: 'white', name: '14k White Gold', colorCode: '#F0EDE8' },
    { id: 'rose', name: '14k Rose Gold', colorCode: '#F0B49E' },
  ];

  return (
    <div className="app-container">
      {/* Top Navigation Mock */}
      <nav className="top-nav">
        <div className="logo">LUMIÈRE & CO.</div>
        <div className="nav-links">
          <span>Engagement</span>
          <span>Wedding</span>
          <span>Diamonds</span>
          <span>Jewelry</span>
        </div>
      </nav>

      <main className="product-layout">
        {/* Left Side - 3D Viewer */}
        <div className="viewer-section">
          <div className="viewer-wrapper">
            <RingViewer modelPath={`/${getModelFile()}`} metalColor={metalColor} />
            <div className="viewer-overlay-text">
              Interact to rotate and zoom <br />
              <span>Drag to spin • Scroll to zoom</span>
            </div>
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="details-section">
          <div className="details-content">
            <div className="breadcrumbs">
              Engagement Rings <ChevronRight size={14} /> Build Your Own
            </div>
            
            <h1 className="product-title">{getTitle()}</h1>
            
            <div className="reviews">
              <div className="stars">
                <Star size={14} fill="#111" stroke="#111" />
                <Star size={14} fill="#111" stroke="#111" />
                <Star size={14} fill="#111" stroke="#111" />
                <Star size={14} fill="#111" stroke="#111" />
                <Star size={14} fill="#111" stroke="#111" />
              </div>
              <span>(128 Reviews)</span>
            </div>

            <p className="product-price">{getPrice()}</p>
            <p className="product-description">
              A custom-built symbol of love. Select your perfect setting style, metal color, and diamond shape to create a ring as unique as your story.
            </p>

            <div className="customization-group">
              <h3 className="group-title">1. Choose Diamond Shape</h3>
              <p className="selected-value">{diamondShape.charAt(0).toUpperCase() + diamondShape.slice(1)}</p>
              <div className="shape-grid">
                {['round', 'oval', 'cushion', 'emerald'].map(shape => (
                  <button 
                    key={shape} 
                    className={`shape-btn ${diamondShape === shape ? 'active' : ''} ${shape !== 'round' ? 'disabled' : ''}`}
                    onClick={() => shape === 'round' && setDiamondShape(shape)}
                  >
                    <div className={`shape-icon ${shape}`}></div>
                    <span>{shape.charAt(0).toUpperCase() + shape.slice(1)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="customization-group">
              <h3 className="group-title">2. Choose Metal Color</h3>
              <p className="selected-value">{metals.find(m => m.id === metalColor)?.name}</p>
              <div className="metal-options">
                {metals.map(metal => (
                  <button 
                    key={metal.id}
                    className={`metal-btn ${metalColor === metal.id ? 'active' : ''}`}
                    onClick={() => setMetalColor(metal.id)}
                    style={{ backgroundColor: metal.colorCode }}
                    aria-label={metal.name}
                  >
                    {metalColor === metal.id && <Check size={16} color={metal.id === 'white' ? '#111' : '#fff'} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="customization-group">
              <h3 className="group-title">3. Setting Style</h3>
              
              <div className="setting-toggles">
                <div className="toggle-row">
                  <span className="toggle-label">Center Setting</span>
                  <div className="toggle-group">
                    <button className={`toggle-btn ${!hasHalo ? 'active' : ''}`} onClick={() => setHasHalo(false)}>Solitaire</button>
                    <button className={`toggle-btn ${hasHalo ? 'active' : ''}`} onClick={() => setHasHalo(true)}>Halo (+$350)</button>
                  </div>
                </div>

                <div className="toggle-row">
                  <span className="toggle-label">Band Style</span>
                  <div className="toggle-group">
                    <button className={`toggle-btn ${!hasPave ? 'active' : ''}`} onClick={() => setHasPave(false)}>Plain</button>
                    <button className={`toggle-btn ${hasPave ? 'active' : ''}`} onClick={() => setHasPave(true)}>Pavé (+$450)</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <button className="primary-btn">
                <Diamond size={18} /> Choose Diamond
              </button>
              <button className="secondary-btn">Add to Bag</button>
            </div>
            
            <div className="shipping-info">
              <span>Free Shipping & Returns</span>
              <span>•</span>
              <span>Lifetime Warranty</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
