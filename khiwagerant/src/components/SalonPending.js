// components/SalonPending.js
function SalonPending() {
    return (
      <div className="pending-container">
        <h2>Votre salon est en cours de validation</h2>
        <p>Vous recevrez un email lorsque votre salon sera approuvé.</p>
        <button onClick={() => window.location.reload()}>
          Vérifier le statut
        </button>
      </div>
    );
  }