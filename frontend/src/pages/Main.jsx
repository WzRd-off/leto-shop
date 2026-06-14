import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { productsAPI, healthAPI } from '../services/api';

export default function MainPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [dbOk, setDbOk] = useState(false);

  useEffect(() => {
    healthAPI.check().then(() => setDbOk(true)).catch(() => setDbOk(false));
    productsAPI.getFeatured()
      .then((data) => setFeatured(Array.isArray(data) ? data.slice(0, 4) : []))
      .catch(() => setFeatured([]));
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const scrollToServices = (e) => {
    e.preventDefault();
    const element = document.getElementById('catalog');
    if (element) {
      const headerOffset = 72; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <>
      <Header />
      <div className="home-container">

          <section className="hero-section">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="h1">Рідкісні кімнатні рослини та екзотична ботаніка</h1>
            <p className="text-body">
              FloraRare — інтернет-магазин для колекціонерів і поціновувачів унікальних рослин. Актуальний асортимент{dbOk ? ' завантажено' : ''} з каталогу.
            </p>
            <div className="hero-actions">
              <Link to="/catalog" className="btn-filled">До каталогу</Link>
              <a href="#catalog" onClick={scrollToServices} className="btn-outline btn-outline-white">Популярні товари</a>
            </div>
          </div>
          
          {/* ОБНОВЛЕННАЯ КНОПКА СКРОЛЛА ВНИЗ */}
          <a href="#catalog" onClick={scrollToServices} className="scroll-indicator">
            <span>Дослідити</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </a>
        </section>

        {/* SERVICES BENTO GRID SECTION */}
        <section id="catalog" className="services-section">
          <h2 className="h2">Популярні товари</h2>
          <p className="text-body section-subtitle">
            Оберіть рослину з актуального асортименту нашого магазину.
          </p>

          {featured.length > 0 && (
            <div className="co-grid" style={{ marginBottom: 32 }}>
              {featured.map((p) => (
                <Link key={p.id} to={`/products/${p.id}`} className="bento-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 className="bento-title">{p.name}</h3>
                  <p className="text-body">{Number(p.price).toLocaleString('uk-UA')} ₴</p>
                </Link>
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link to="/catalog" className="btn-filled">Весь каталог</Link>
          </div>
          
          <div className="bento-grid" style={{ display: 'none' }}>
            <div className="bento-card bento-large">
              <div className="bento-image-area">
                <img className="bento-image" src="/garden-service.jpg" alt="Садівництво та догляд" />
              </div>
              <h3 className="bento-title">Садівництво та догляд</h3>
              <p className="text-body">
                Професійний догляд за деревами, кущами та квітниками. Здійснюємо санітарну та формувальну обрізку, лікування рослин від хвороб, а також сезонну посадку та регулярне підживлення ґрунту еко-добривами.
              </p>
            </div>

            <div className="bento-card bento-tall">
              <div className="bento-image-area">
                <img className="bento-image" src="/irrigation-system.jpg" alt="Системи поливу" />
              </div>
              <h3 className="bento-title">Системи поливу</h3>
              <p className="text-body">
                Проектування, монтаж та налаштування розумних систем автоматичного та крапельного поливу. Регулярний моніторинг вологості для здоров'я ваших рослин.
              </p>
            </div>

            <div className="bento-card bento-small-1">
              <div className="bento-image-area">
                <img className="bento-image" src="/model.avif" alt="Ландшафтний дизайн" />
              </div>
              <h3 className="bento-title">Ландшафтний дизайн</h3>
              <p className="text-body bento-small-text">Створення 3D-проектів, зонування та планування ділянки.</p>
            </div>

            <div className="bento-card bento-small-2">
              <div className="bento-image-area">
                <img className="bento-image" src="/dern.jpg" alt="Ідеальний газон" />
              </div>
              <h3 className="bento-title">Ідеальний газон</h3>
              <p className="text-body bento-small-text">Укладання рулонного газону, аерація та систематична стрижка.</p>
            </div>

            <div className="bento-card bento-wide">
              <div className="bento-image-area">
                <img className="bento-image" src="/organic.jpg" alt="Екологічні матеріали" />
              </div>
              <h3 className="bento-title">Екологічні матеріали</h3>
               <p className="text-body">Ми використовуємо лише сертифіковані органічні добрива та безпечні засоби захисту рослин, зберігаючи мікрофлору ґрунту.</p>
            </div>
          </div>
        </section>

        {/* СЕКЦИЯ: ПРОЦЕСС РАБОТЫ */}
        <section className="process-section">
          <div className="container-wrapper">
            <div className="section-header-center">
              <h2 className="h2">Як ми працюємо</h2>
              <p className="text-body section-subtitle">
                Прозорий та зрозумілий процес від першого дзвінка до квітучого саду.
              </p>
            </div>
            
            <div className="process-grid">
              {[
                { step: '01', title: 'Заявка і виїзд', desc: 'Огляд ділянки, заміри, аналіз ґрунту та обговорення ваших побажань.' },
                { step: '02', title: 'Проектування', desc: 'Створення 3D-ескізу, підбір рослин та складання прозорого кошторису.' },
                { step: '03', title: 'Реалізація', desc: 'Доставка матеріалів, підготовка ґрунту, посадка та монтаж систем поливу.' },
                { step: '04', title: 'Підтримка', desc: 'Гарантійний догляд, сезонна обрізка та регулярне обслуговування ділянки.' }
              ].map((item, index) => (
                <div key={index} className="process-card">
                  <div className="process-step-bg">{item.step}</div>
                  <h3 className="h3 process-title">{item.title}</h3>
                  <p className="text-body">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* СЕКЦИЯ: FAQ (АККОРДЕОН) */}
        <section className="faq-section">
          <div className="faq-container">
            <div className="section-header-center">
              <h2 className="h2">Часті запитання</h2>
              <p className="text-body section-subtitle">
                Відповіді на найпопулярніші запитання наших клієнтів.
              </p>
            </div>
            
            <div className="faq-list">
              {[
                { q: 'Чи даєте ви гарантію на приживлюваність рослин?', a: 'Так, ми надаємо гарантію на всі висаджені нами рослини терміном на 1 рік за умови дотримання наших рекомендацій щодо догляду або замовлення послуги регулярного обслуговування.' },
                { q: 'З якими площами ви працюєте?', a: 'Ми реалізуємо проекти будь-якого масштабу — від невеликих приватних дворів (від 1 сотки) до великих комерційних територій.' },
                { q: 'Чи можна замовити лише проект без реалізації?', a: 'Звісно. Ви можете замовити детальний ландшафтний проект, який включає 3D-візуалізацію, креслення та дендроплан, і реалізувати його самостійно.' },
                { q: 'Як формується вартість послуг?', a: 'Вартість залежить від площі ділянки, обраних матеріалів, складності робіт та вартості самих рослин. Після виїзду фахівця ми складаємо детальний кошторис до початку робіт.' }
              ].map((faq, i) => (
                <div key={i} className={`faq-item ${activeFaq === i ? 'active' : ''}`}>
                  <button className="faq-button" onClick={() => toggleFaq(i)}>
                    <span className="h3 faq-question">{faq.q}</span>
                    <svg className="faq-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  <div className="faq-answer-wrapper">
                    <div className="faq-answer-inner">
                      <p className="text-body faq-answer-text">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section id="contacts" className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2 className="h2">Почніть свій шлях до ідеального саду</h2>
              <p className="text-body">
                Створіть особистий кабінет, щоб легко додавати свої ділянки, відстежувати стан рослин та замовляти послуги нашої бригади онлайн у кілька кліків.
              </p>
              <div>
                <Link to="/auth" className="btn-filled cta-btn-inverted">
                  Зареєструватися або увійти
                </Link>
              </div>
            </div>

            <div className="cta-contacts">
              <div className="contact-widget">
                <div className="widget-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div className="widget-info">
                  <h4>Зателефонуйте нам</h4>
                  <p>+38 (099) 123-45-67</p>
                </div>
              </div>

              <div className="contact-widget">
                <div className="widget-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="widget-info">
                  <h4>Напишіть нам</h4>
                  <p>hello@ecogarden.ua</p>
                </div>
              </div>

              <div className="contact-widget">
                <div className="widget-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="widget-info">
                  <h4>Наш офіс</h4>
                  <p>м. Київ, вул. Садова, 15</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}