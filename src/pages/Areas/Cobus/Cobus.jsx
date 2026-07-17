    function StreamlitEmbed() {
  return (
    <iframe
      src="http://192.168.0.68:8501"
      title="Streamlit App"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
      }}
      allow="fullscreen"
    />
  );
}

export default StreamlitEmbed;