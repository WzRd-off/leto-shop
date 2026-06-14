-- Rare plants e-shop schema (PostgreSQL)
-- Test password for all users: Test123!

DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS product_comments CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS order_statuses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    role_id INTEGER NOT NULL REFERENCES roles(id),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100),
    characteristics JSONB DEFAULT '{}',
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('visa', 'mastercard')),
    last_four VARCHAR(4) NOT NULL,
    exp_month SMALLINT NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
    exp_year SMALLINT NOT NULL CHECK (exp_year BETWEEN 2024 AND 2099),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_statuses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status_id INTEGER NOT NULL REFERENCES order_statuses(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method_id INTEGER REFERENCES payment_methods(id),
    paid_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    external_ref VARCHAR(100),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_comments (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_comments_product ON product_comments(product_id);

-- Roles
INSERT INTO roles (id, name) VALUES
    (1, 'Клієнт'),
    (2, 'Керівник');

-- Users (password: Test123!)
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id) VALUES
    (1, 'director@flora.ua', '$2b$10$5vPp.Zxe3tLgiN8qFogRyuXZZdEhwILzsdBjSggE8E7jfrSvI.Oky', 'Олена', 'Коваль', '+380501111111', 2),
    (2, 'client@flora.ua', '$2b$10$5vPp.Zxe3tLgiN8qFogRyuXZZdEhwILzsdBjSggE8E7jfrSvI.Oky', 'Іван', 'Петренко', '+380502222222', 1),
    (3, 'maria@flora.ua', '$2b$10$5vPp.Zxe3tLgiN8qFogRyuXZZdEhwILzsdBjSggE8E7jfrSvI.Oky', 'Марія', 'Шевченко', '+380503333333', 1);

SELECT setval('users_id_seq', 3);

-- Order statuses
INSERT INTO order_statuses (id, name, sort_order) VALUES
    (1, 'Отримано', 1),
    (2, 'В обробці', 2),
    (3, 'Відправлено', 3),
    (4, 'Доставлено', 4),
    (5, 'Закрито', 5);

SELECT setval('order_statuses_id_seq', 5);

-- Categories
INSERT INTO categories (id, name, description, sort_order) VALUES
    (1, 'Кімнатні рослини', 'Монстера, фікус, сансевієрія та інші зелені улюбленці', 1),
    (2, 'Квіти', 'Орхідеї, фіалки, антуріуми — квітучі рослини для дому', 2),
    (3, 'Екзотика', 'Рідкісні тропічні рослини для справжніх колекціонерів', 3);

SELECT setval('categories_id_seq', 3);

-- Products
INSERT INTO products (id, sku, name, description, price, stock_quantity, category, characteristics, image_url) VALUES
    (1, 'FL-001', 'Монстера делісіоза', 'Монстера делісіоза — одна з найпопулярніших кімнатних рослин завдяки великим розрізаним листям. Походить із тропічних лісів Центральної Америки та легко адаптується до домашніх умов. Швидко росте при належному догляді та чудово виглядає як самостійний акцент у вітальні чи офісі. Ідеальний вибір для тих, хто хоче додати інтер''єру тропічного характеру.', 890.00, 15, 'Кімнатні рослини', '{"care":"Поливайте, коли верхній шар ґрунту підсохне — зазвичай раз на 7–10 днів. Не залишайте рослину в прямому сонячному світлі, щоб уникнути опіків на листі. Протирайте листя вологою ганчіркою раз на два тижні для кращого дихання. Підживлюйте рідким добривом раз на місяць у період активного росту (весна–літо).","Освітлення":"розсіяне","Полив":"помірний","Висота (см)":80}', '/images/monstera.jpg'),
    (2, 'FL-002', 'Фіалка африканська Purple', 'Африканська фіалка Purple — компактна квітуча рослина, яка дарує насичені фіолетові квіти протягом усього року. Ідеальна для підвіконь із помірним освітленням та стабільною температурою. Невибаглива у догляді та підходить навіть початківцям-флористам. Завдяки своїй невеликій вазі чудово вписується на робочий стіл або полицю.', 145.00, 40, 'Квіти', '{"care":"Поливайте тільки під корінь, уникаючи потрапляння води на листя — це може спричинити плями. Тримайте температуру стабільною, без різких перепадів і протягів. Пересаджуйте раз на рік після завершення цвітіння. Видаляйте засохлі квітки для стимуляції нового цвітіння.","Освітлення":"яскраве розсіяне","Полив":"регулярний","Квітування":"фіолетове"}', '/images/violet.jpg'),
    (3, 'FL-003', 'Сансевієрія лауренті', 'Сансевієрія лауренті — одна з найневибагливіших кімнатних рослин, яку часто називають «тещин язик». Витримує слабке освітлення, рідкий полив та сухе повітря в офісах. Відома здатністю очищувати повітря від токсинів за даними NASA. Чудово підходить для початківців та зайнятих людей, які не мають багато часу на догляд.', 320.00, 25, 'Кімнатні рослини', '{"care":"Поливайте рідко — раз на 2–3 тижні, дозволяючи ґрунту повністю висохнути між поливами. Переливання — головна причина загибелі цієї рослини. Не потребує частого пересаджування — раз на 2–3 роки достатньо. Протирайте листя від пилу раз на місяць.","Освітлення":"будь-яке","Полив":"рідкий","Висота (см)":50}', '/images/sansevieria.jpg'),
    (4, 'FL-004', 'Орхідея фаленопсіс White', 'Орхідея фаленопсіс White — елегантна квіткова рослина з витонченими білими квітами, що нагадують метеликів. Цвіте до 3 місяців безперервно при правильному догляді. Популярна серед колекціонерів завдяки довгому періоду цвітіння та вишуканому вигляду. Чудово доповнює сучасний інтер''єр та створює атмосферу спокою.', 520.00, 12, 'Квіти', '{"care":"Поливайте раз на 7–10 днів, занурюючи горщик у воду на 15 хвилин. Після поливу дайте воді повністю стекти — коріння не повинно стояти у воді. Підтримуйте вологість повітря 50–70%, обприскуючи повітря навколо рослини. Підживлюйте спеціальним добривом для орхідей раз на 2 тижні під час цвітіння.","Освітлення":"розсіяне","Вологість":"висока"}', '/images/orchid.jpg'),
    (5, 'FL-005', 'Алоказія полі', 'Алоказія полі — декоративна екзотична рослина з великими серцеподібними листками та сріблястими прожилками. Походить із тропіків Південно-Східної Азії та потребує трохи більше уваги, ніж звичайні кімнатні рослини. Завдяки своїй вражаючій текстурі листя стає справжньою перлиною будь-якої колекції. Підходить для досвідчених любителів рослин.', 750.00, 8, 'Екзотика', '{"care":"Тримайте ґрунт помірно вологим, але не переувлажненим — поливайте, коли верхній шар підсохне. Забезпечте високу вологість повітря, розмістивши горщик на піддоні з вологим керамзитом. Уникайте протягів та різких перепадів температури. Взимку зменшіть полив та припиніть підживлення.","Освітлення":"яскраве розсіяне","Полив":"помірний"}', '/images/alocasia.jpg'),
    (6, 'FL-006', 'Калатея медальйон', 'Калатея медальйон — рослина з яскравими орнаментальними листками, що нагадують витончений візерунок. Листя згортається ввечері та розгортається вранці — це природна особливість роду калатея. Потребує стабільних умов та підвищеної вологості. Ідеальна для ванних кімнат або кухонь, де повітря більш вологе.', 410.00, 18, 'Кімнатні рослини', '{"care":"Поливайте регулярно, підтримуючи ґрунт злегка вологим, але не мокрим. Використовуйте дистильовану або відстояну воду — калатея чутлива до хлору. Обприскуйте листя 2–3 рази на тиждень або використовуйте зволожувач повітря. Не переставляйте рослину з місця на місце — вона не любить змін.","Освітлення":"напівтінь","Вологість":"висока"}', '/images/calathea.jpg'),
    (7, 'FL-007', 'Фікус лірата', 'Фікус лірата — велична деревоподібна рослина з великими листками у формі скрипки. Символ сучасного мінімалістичного інтер''єру та один із найпопулярніших «дерев у горщику». Може досягати значної висоти в домашніх умовах при належному догляді. Створює відчуття тропічного саду прямо у вашій вітальні.', 1200.00, 6, 'Кімнатні рослини', '{"care":"Поливайте, коли верхні 3–5 см ґрунту підсохнуть. Протирайте великі листя вологою ганчіркою щомісяця — це покращує фотосинтез. Переставляйте рослину обережно — фікус скидає листя при різкій зміні умов. Підживлюйте раз на 2 тижні весною та літом. Обрізайте для формування крони навесні.","Висота (см)":120,"Освітлення":"яскраве розсіяне"}', '/images/ficus.jpg'),
    (8, 'FL-008', 'Антуріум червоний', 'Антуріум червоний — тропічна квіткова рослина з глянцевими серцеподібними квітами насиченого червоного кольору. Цвіте майже цілий рік при належному догляді та створює яскравий акцент у будь-якому приміщенні. Вважається символом любові та гостинності в багатьох культурах. Підходить для подарунка або оформлення святкового інтер''єру.', 680.00, 10, 'Квіти', '{"care":"Тримайте ґрунт злегка вологим — поливайте 1–2 рази на тиждень. Антуріум любить тепло (20–25°C) та високу вологість — обприскуйте листя регулярно. Уникайте прямих сонячних променів, які можуть пошкодити ніжні квіти. Видаляйте засохлі квітконоси для стимуляції нового цвітіння.","Квітування":"червоне","Полив":"помірний"}', '/images/anthurium.jpg'),
    (9, 'FL-009', 'Хлорофітум зелений', 'Хлорофітум зелений — невибаглива рослина з довгими вузькими листками, відома як один із найкращих природних очищувачів повітря. Легко розмножується «дітками» на довгих стеблах, які можна відділити та посадити. Безпечний для домашніх тварин та дітей. Чудово виглядає у підвісному горщику або на високій полиці.', 195.00, 35, 'Кімнатні рослини', '{"care":"Поливайте помірно, коли верхній шар ґрунту підсохне — зазвичай раз на тиждень. Хлорофітум не вимогливий до освітлення, але на яскравому місці росте швидше. Пересаджуйте, коли коріння заповнює горщик. Відділяйте діток для розмноження, коли вони досягнуть 5–7 см.","Освітлення":"розсіяне","Безпечно для тварин":"Так"}', '/images/chlorophytum.jpg'),
    (10, 'FL-010', 'Стреліція ніколай', 'Стреліція ніколай — вражаюча тропічна рослина з величезними листками, схожими на віяло пальми. У природних умовах може досягати 6 метрів, а вдома — до 2–3 метрів. Створює відчуття справжнього тропічного раю та є справжньою перлиною колекції. Потребує простору та яскравого освітлення, тому ідеальна для світлих віталень.', 1450.00, 4, 'Екзотика', '{"care":"Поливайте рясно влітку, коли верхній шар ґрунту підсохне, взимку зменшіть частоту. Обприскуйте листя щодня або використовуйте зволожувач — стреліція любить вологе повітря. Протирайте великі листя від пилу раз на тиждень. Пересаджуйте раз на 2 роки у більший горщик. Підживлюйте раз на 2 тижні в період активного росту.","Висота (см)":150,"Освітлення":"яскраве розсіяне"}', '/images/strelitzia.jpg');

SELECT setval('products_id_seq', 10);

INSERT INTO product_images (product_id, url, sort_order) VALUES
    (1, '/images/monstera.jpg', 0),
    (1, '/images/monstera-2.jpg', 1),
    (4, '/images/orchid.jpg', 0),
    (4, '/images/orchid-2.jpg', 1);

-- Payment methods
INSERT INTO payment_methods (id, user_id, card_type, last_four, exp_month, exp_year, is_default) VALUES
    (1, 2, 'visa', '4242', 12, 2027, TRUE),
    (2, 2, 'mastercard', '5555', 6, 2028, FALSE),
    (3, 3, 'visa', '1234', 3, 2029, TRUE);

SELECT setval('payment_methods_id_seq', 3);

-- Cart sample
INSERT INTO cart_items (user_id, product_id, quantity) VALUES
    (2, 3, 2),
    (2, 9, 1);

-- Orders
INSERT INTO orders (id, user_id, status_id, total_amount, payment_method_id, paid_at, closed_at, created_at) VALUES
    (1, 2, 5, 1035.00, 1, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
    (2, 3, 3, 520.00, 3, NOW() - INTERVAL '3 days', NULL, NOW() - INTERVAL '3 days'),
    (3, 2, 1, 410.00, 1, NOW() - INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day');

SELECT setval('orders_id_seq', 3);

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (1, 1, 1, 890.00),
    (1, 9, 1, 145.00),
    (2, 4, 1, 520.00),
    (3, 6, 1, 410.00);

INSERT INTO payments (order_id, amount, status, external_ref) VALUES
    (1, 1035.00, 'success', 'PAY-MOCK-001'),
    (2, 520.00, 'success', 'PAY-MOCK-002'),
    (3, 410.00, 'success', 'PAY-MOCK-003');

-- Comments
INSERT INTO product_comments (product_id, user_id, author_name, content, is_anonymous) VALUES
    (1, 2, 'Іван Петренко', 'Чудова рослина, прижилась за тиждень!', FALSE),
    (1, NULL, 'Гість', 'Дуже гарні листки, дякую магазину.', TRUE),
    (4, 3, 'Марія Шевченко', 'Орхідея цвіте вже другий місяць.', FALSE),
    (3, NULL, 'Анонім', 'Легка у догляді, рекомендую.', TRUE);

-- Audit samples
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details) VALUES
    (2, 'login', 'user', 2, '{"ip":"127.0.0.1"}'),
    (1, 'order_status_change', 'order', 2, '{"from":2,"to":3}'),
    (2, 'checkout', 'order', 3, '{"total":410}');
