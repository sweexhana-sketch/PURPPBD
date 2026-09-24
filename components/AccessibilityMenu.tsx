import React, { useState, useEffect, useCallback } from 'react';

const AccessibilityMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Accessibility States
    const [voiceMode, setVoiceMode] = useState(false);
    const [textSize, setTextSize] = useState(100);
    const [grayscale, setGrayscale] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [hideImages, setHideImages] = useState(false);
    const [alignJustify, setAlignJustify] = useState(false);
    const [dyslexicFont, setDyslexicFont] = useState(false);
    const [lineHeight, setLineHeight] = useState(false);
    const [pauseAnimation, setPauseAnimation] = useState(false);
    const [bigCursor, setBigCursor] = useState(false);
    const [textSpacing, setTextSpacing] = useState(false);
    const [underlineLinks, setUnderlineLinks] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    // Screen Reader Logic
    const handleMouseOver = useCallback((e: MouseEvent) => {
        if (!voiceMode) return;
        const target = e.target as HTMLElement;
        const text = target.innerText || target.getAttribute('aria-label') || target.getAttribute('alt');
        if (text && text.trim().length > 0 && target.children.length === 0) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            speechSynthesis.speak(utterance);
        }
    }, [voiceMode]);

    useEffect(() => {
        if (voiceMode) {
            document.addEventListener('mouseover', handleMouseOver);
        } else {
            document.removeEventListener('mouseover', handleMouseOver);
            speechSynthesis.cancel();
        }
        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
        };
    }, [voiceMode, handleMouseOver]);

    // Apply Styles Dynamically
    useEffect(() => {
        const root = document.documentElement;
        
        // Text Size
        root.style.fontSize = `${textSize}%`;

        // Filters
        const filters = [];
        if (grayscale) filters.push('grayscale(100%)');
        if (highContrast) filters.push('contrast(150%)');
        document.body.style.filter = filters.length > 0 ? filters.join(' ') : '';

        // Add dynamic styles for other features
        let styleTag = document.getElementById('a11y-styles');
        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = 'a11y-styles';
            document.head.appendChild(styleTag);
        }

        let css = '';
        if (hideImages) css += `img, video, iframe { opacity: 0 !important; visibility: hidden !important; }\n`;
        if (alignJustify) css += `* { text-align: justify !important; }\n`;
        if (dyslexicFont) css += `* { font-family: 'Comic Sans MS', 'OpenDyslexic', sans-serif !important; }\n`;
        if (lineHeight) css += `* { line-height: 2 !important; }\n`;
        if (pauseAnimation) css += `* { animation: none !important; transition: none !important; scroll-behavior: auto !important; }\n`;
        if (bigCursor) css += `* { cursor: zoom-in !important; }\n`;
        if (textSpacing) css += `* { letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }\n`;
        if (underlineLinks) css += `a, button, [role="button"] { text-decoration: underline !important; text-underline-offset: 4px !important; }\n`;

        styleTag.innerHTML = css;

    }, [textSize, grayscale, highContrast, hideImages, alignJustify, dyslexicFont, lineHeight, pauseAnimation, bigCursor, textSpacing, underlineLinks]);

    const btnClass = (isActive: boolean) => 
        `flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${isActive ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-gray-50'} shadow-sm`;

    return (
        <>
            {/* Floating Toggle Button */}
            <button
                onClick={toggleMenu}
                className="fixed bottom-6 left-6 z-[100] w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 hover:scale-110 transition-all focus:outline-none focus:ring-4 focus:ring-red-300"
                aria-label="Menu Aksesibilitas"
            >
                <i className="fas fa-universal-access text-3xl"></i>
            </button>

            {/* Accessibility Menu Panel */}
            {isOpen && (
                <div className="fixed inset-0 z-[101] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 md:p-8" onClick={toggleMenu}>
                    <div 
                        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-red-600 text-white px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl md:text-2xl font-bold flex items-center">
                                <i className="fas fa-universal-access mr-3 text-3xl"></i>
                                Menu Aksesibilitas
                            </h2>
                            <button 
                                onClick={toggleMenu}
                                className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-700 flex items-center justify-center transition-colors"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <button onClick={() => setVoiceMode(!voiceMode)} className={btnClass(voiceMode)}>
                                    <i className="fas fa-volume-up text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Moda Suara</span>
                                </button>
                                
                                <button onClick={() => setTextSize(prev => prev < 200 ? prev + 10 : prev)} className={btnClass(false)}>
                                    <i className="fas fa-search-plus text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Perbesar Teks</span>
                                </button>

                                <button onClick={() => setTextSize(prev => prev > 50 ? prev - 10 : prev)} className={btnClass(false)}>
                                    <i className="fas fa-search-minus text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Perkecil Teks</span>
                                </button>

                                <button onClick={() => setGrayscale(!grayscale)} className={btnClass(grayscale)}>
                                    <i className="fas fa-adjust text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Kejenuhan</span>
                                </button>

                                <button onClick={() => setHighContrast(!highContrast)} className={btnClass(highContrast)}>
                                    <i className="fas fa-moon text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Kontras+</span>
                                </button>

                                <button onClick={() => setHideImages(!hideImages)} className={btnClass(hideImages)}>
                                    <i className="fas fa-image text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Sembunyikan Gambar</span>
                                </button>

                                <button onClick={() => setAlignJustify(!alignJustify)} className={btnClass(alignJustify)}>
                                    <i className="fas fa-align-justify text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Rata Tulisan</span>
                                </button>

                                <button onClick={() => setDyslexicFont(!dyslexicFont)} className={btnClass(dyslexicFont)}>
                                    <i className="fas fa-font text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Ramah Disleksia</span>
                                </button>

                                <button onClick={() => setLineHeight(!lineHeight)} className={btnClass(lineHeight)}>
                                    <i className="fas fa-arrows-alt-v text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Tinggi Garis</span>
                                </button>

                                <button onClick={() => setPauseAnimation(!pauseAnimation)} className={btnClass(pauseAnimation)}>
                                    <i className="fas fa-hourglass-half text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Animasi Dijeda</span>
                                </button>

                                <button onClick={() => setBigCursor(!bigCursor)} className={btnClass(bigCursor)}>
                                    <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Kursor</span>
                                </button>

                                <button onClick={() => setTextSpacing(!textSpacing)} className={btnClass(textSpacing)}>
                                    <i className="fas fa-text-width text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Spasi Teks</span>
                                </button>

                                <button onClick={() => setUnderlineLinks(!underlineLinks)} className={btnClass(underlineLinks)}>
                                    <i className="fas fa-link text-3xl mb-2"></i>
                                    <span className="text-sm font-bold text-center">Garis Bawahi Tautan</span>
                                </button>
                                
                                <button onClick={() => {
                                    setVoiceMode(false);
                                    setTextSize(100);
                                    setGrayscale(false);
                                    setHighContrast(false);
                                    setHideImages(false);
                                    setAlignJustify(false);
                                    setDyslexicFont(false);
                                    setLineHeight(false);
                                    setPauseAnimation(false);
                                    setBigCursor(false);
                                    setTextSpacing(false);
                                    setUnderlineLinks(false);
                                }} className={btnClass(false)}>
                                    <i className="fas fa-sync-alt text-3xl mb-2 text-gray-500"></i>
                                    <span className="text-sm font-bold text-center text-gray-500">Reset Semua</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AccessibilityMenu;
