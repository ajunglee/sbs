import Footer from "../components/Footer";
import GNB from "../components/Gnb";
import './Home.css';

function Home() {
  return (
    <>
      <GNB />
      <main className="home-container">
        <section className="home-hero">
          <p className="home-eyebrow">Technology Feed</p>
          <h1>My Work</h1>
          <p className="home-subtitle">Posts, profiles, and social updates in one clean interface.</p>
        </section>
      </main>
      <Footer />
    </>    
  );
}

export default Home;
