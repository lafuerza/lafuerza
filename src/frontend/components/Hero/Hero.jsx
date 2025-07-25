import { Link } from 'react-router-dom';
import { useIsMobile } from '../../hooks';
import styles from './Hero.module.css';

const jethalalBanner = '/lovepik.png';

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <section className='white-bcg'>
      <div className={`container ${styles.hero}`}>
        <article className={styles.content}>
          <h1>La plataforma de comercio detrás de todo</h1>

          <p>
            ¡Bienvenido a Yero Shop! Vende online y en persona. Vende a nivel local y mundial.
          </p>

          <Link to='/products' className={`btn ${styles.btnHero}`}>
            Comprar ahora
          </Link>
        </article>

        {!isMobile && (
          <article className={styles.imageContainer}>
            <img
              src={jethalalBanner}
              alt="jethalal"
              className={styles.banner}
            />
          </article>
        )}
      </div>
    </section>
  );
};

export default Hero;