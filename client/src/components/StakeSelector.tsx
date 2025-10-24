import { useGame } from '@/lib/stores/useGame';

export function StakeSelector() {
  const credits = useGame(state => state.credits);
  const stake = useGame(state => state.stake);
  const availableStakes = useGame(state => state.availableStakes);
  const setStake = useGame(state => state.setStake);

  const handleTouchButton = (callback: () => void) => {
    return {
      onClick: callback,
      onTouchStart: (e: React.TouchEvent) => {
        e.preventDefault();
        callback();
      }
    };
  };
  
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '4px solid #333',
      borderRadius: '15px',
      padding: '25px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      fontFamily: "'Courier New', monospace",
      minWidth: '350px',
      maxWidth: '90vw'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '2px'
      }}>
        Choose Your Stake
      </h3>
      
      <div style={{
        backgroundColor: '#000',
        padding: '10px 15px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '3px'
        }}>
          AVAILABLE CREDITS
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#ff0000',
          letterSpacing: '2px'
        }}>
          ${credits.toFixed(2)}
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px'
      }}>
        {availableStakes.map((stakeOption) => {
          const isSelected = stake === stakeOption;
          const isDisabled = stakeOption > credits;
          
          return (
            <button
              key={stakeOption}
              {...(!isDisabled ? handleTouchButton(() => setStake(stakeOption)) : { onClick: undefined, onTouchStart: undefined })}
              disabled={isDisabled}
              style={{
                padding: '15px 10px',
                minHeight: '60px',
                fontSize: '18px',
                fontWeight: 'bold',
                backgroundColor: isSelected ? '#d64545' : (isDisabled ? '#ccc' : '#fff'),
                color: isSelected ? '#fff' : (isDisabled ? '#999' : '#333'),
                border: isSelected ? '3px solid #ff0000' : '3px solid #333',
                borderRadius: '10px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: isSelected ? '0 0 15px rgba(214, 69, 69, 0.5)' : '0 2px 5px rgba(0,0,0,0.2)',
                fontFamily: "'Courier New', monospace",
                textTransform: 'uppercase',
                opacity: isDisabled ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.backgroundColor = '#ff9999';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              ${stakeOption.toFixed(2)}
            </button>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        Selected: <span style={{ 
          color: '#d64545', 
          fontWeight: 'bold',
          fontSize: '16px'
        }}>${stake.toFixed(2)}</span>
      </div>
    </div>
  );
}
