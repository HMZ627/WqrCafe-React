return (
    <div
      id="wf-testi-box"
      onWheel={(e) => {
        e.stopPropagation();
        if (Math.abs(e.deltaY) < 6 || wheelLockRef.current) return;
        wheelLockRef.current = true;
        step(e.deltaY > 0 ? 1 : -1);
        setTimeout(() => {
          wheelLockRef.current = false;
        }, 320);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        touchStartYRef.current = e.touches[0].clientY;
        touchHandledRef.current = false;
      }}
      onTouchMove={(e) => {
        e.stopPropagation();
        if (touchStartYRef.current === null) return;
        const diff = touchStartYRef.current - e.touches[0].clientY;
        if (!touchHandledRef.current && Math.abs(diff) > 20) {
          touchHandledRef.current = true;
          step(diff > 0 ? 1 : -1);
        }
      }}
      style={{
        position: 'relative',
        height: '380px',
        maxWidth: '740px',
        margin: '0 auto',
        overflow: 'hidden',
        borderRadius: '24px',
        background: 'rgba(18, 17, 14, 0.58)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(212,175,55,0.28)',
        perspective: '900px',
        userSelect: 'none',
        cursor: 'ns-resize',
        touchAction: 'none',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 16%, #000 84%, transparent 100%)',
      }}
    >
      {reviews.map((rev, idx) => {
        const n = reviews.length;
        let diff = idx - activeIdx;
        if (diff > Math.floor(n / 2)) diff -= n;
        if (diff < -Math.floor(n / 2)) diff += n;
        const pos = Math.abs(diff) <= 2 ? diff : 99;

        return (
          <div
            key={`${rev.name}-${idx}`}
            style={cardStyleForPos(pos)}
            onClick={() => {
              setActiveIdx(idx);
              pauseAndResumeAuto(6000);
            }}
          >
            <div style={{ color: '#F5EFE6', fontSize: '1rem', lineHeight: 1.55, fontStyle: 'italic', marginBottom: '0.7rem' }}>
              “{rev.text}”
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#D4AF37', fontWeight: 700 }}>
              <span>— {rev.name}</span>
              <span style={{ display: 'inline-flex', gap: '3px' }}>
                {Array.from({ length: rev.stars || 5 }).map((_, sIdx) => (
                  <svg key={sIdx} width="14" height="14" viewBox="0 0 24 24" fill="#D4AF37">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
