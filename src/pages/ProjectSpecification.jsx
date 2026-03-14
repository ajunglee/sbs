import Footer from '../components/Footer';
import GNB from '../components/Gnb';
import './ProjectSpecification.css';

const assetModules = import.meta.glob('../assets/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default',
});

const sectionOrder = [
  'backend',
  'frontend',
  'database',
  'infrastructure',
  'devops',
  'test',
  'tooling',
];

const sectionMeta = {
  backend: {
    title: 'BACK-END',
    accent: 'mint',
    description: 'Java 17, Spring Boot 4, Spring Security, JPA, JWT, Kakao OAuth2 기반 서버 구성을 사용합니다.',
  },
  frontend: {
    title: 'FRONT-END',
    accent: 'sky',
    description: 'React 기반 UI와 HTML, CSS, JavaScript로 사용자 화면과 상호작용을 구성합니다.',
  },
  database: {
    title: 'DATABASE',
    accent: 'amber',
    description: 'MySQL 저장소와 Hibernate ORM 계층으로 데이터 모델과 영속성 처리를 담당합니다.',
  },
  infrastructure: {
    title: 'INFRASTRUCTURE',
    accent: 'rose',
    description: 'Docker, Compose, AWS Lightsail 기반으로 운영 환경과 배포 구성을 관리합니다.',
  },
  devops: {
    title: 'DEVOPS / SCM',
    accent: 'violet',
    description: 'GitHub 중심 형상관리와 GitHub Actions, GHCR 기반 CI/CD 흐름을 구성했습니다.',
  },
  test: {
    title: 'TEST',
    accent: 'amber',
    description: 'Postman을 사용해 인증, 게시글, DM 등 주요 API 요청과 응답을 검증합니다.',
  },
  tooling: {
    title: 'DEV TOOLS',
    accent: 'violet',
    description: 'IDE, 로컬 개발 도구, 빌드 및 테스트 보조 도구를 함께 사용합니다.',
  },
};

const cards = [
  {
    id: 'java',
    src: assetModules['../assets/java.svg'],
    title: 'Java',
    tag: '17 LTS',
    section: 'backend',
  },
  {
    id: 'spring-boot',
    src: assetModules['../assets/spring_boot.png'],
    title: 'Spring Boot',
    tag: '4.0.0',
    section: 'backend',
  },
  {
    id: 'spring-security',
    src: assetModules['../assets/spring_boot.png'],
    title: 'Spring Security',
    tag: 'Stateless Auth',
    section: 'backend',
  },
  {
    id: 'spring-data-jpa',
    src: assetModules['../assets/spring_boot.png'],
    title: 'Spring Data JPA',
    tag: 'Repository',
    section: 'backend',
  },
  {
    id: 'jwt',
    src: assetModules['../assets/jwt.png'],
    title: 'JWT',
    tag: 'jjwt 0.12.5',
    section: 'backend',
  },
  {
    id: 'kakao-oauth',
    src: assetModules['../assets/kakao_developer.png'],
    title: 'Kakao OAuth',
    tag: 'OAuth2',
    section: 'backend',
  },
  {
    id: 'react',
    src: assetModules['../assets/react.svg'],
    title: 'React',
    tag: '19',
    section: 'frontend',
  },
  {
    id: 'html',
    src: assetModules['../assets/html_로고-1.png'],
    title: 'HTML',
    tag: 'Markup',
    section: 'frontend',
  },
  {
    id: 'css',
    src: assetModules['../assets/css.png'],
    title: 'CSS',
    tag: 'Styling',
    section: 'frontend',
  },
  {
    id: 'javascript',
    src: assetModules['../assets/javascript.png'],
    title: 'JavaScript',
    tag: 'ES2024',
    section: 'frontend',
  },
  {
    id: 'axios',
    src: assetModules['../assets/axios.png'],
    title: 'Axios',
    tag: 'HTTP',
    section: 'frontend',
  },
  {
    id: 'bootstrap',
    src: assetModules['../assets/Bootstrap.png'],
    title: 'Bootstrap',
    tag: 'UI Kit',
    section: 'frontend',
  },
  {
    id: 'mysql',
    src: assetModules['../assets/mysql.png'],
    title: 'MySQL',
    tag: 'Database',
    section: 'database',
  },
  {
    id: 'hibernate',
    src: assetModules['../assets/hibernate.png'],
    title: 'Hibernate ORM',
    tag: 'ORM Layer',
    section: 'database',
  },
  {
    id: 'docker',
    src: assetModules['../assets/docker.webp'],
    title: 'Docker',
    tag: 'Container',
    section: 'infrastructure',
  },
  {
    id: 'compose',
    src: assetModules['../assets/nginx.png'],
    title: 'Docker Compose',
    tag: 'Compose',
    section: 'infrastructure',
  },
  {
    id: 'aws-lightsail',
    src: assetModules['../assets/aws_logo.svg.png'],
    title: 'AWS Lightsail',
    tag: 'Cloud Hosting',
    section: 'infrastructure',
  },
  {
    id: 'amazon-corretto',
    src: assetModules['../assets/Amazon_Linux_Logo_v08_Amazon-Linux-right—full-color-1260x616.png'],
    title: 'Amazon Corretto 17',
    tag: 'Runtime Image',
    section: 'infrastructure',
  },
  {
    id: 'git',
    src: assetModules['../assets/git.svg'],
    title: 'Git',
    tag: 'SCM',
    section: 'devops',
  },
  {
    id: 'github-actions',
    src: assetModules['../assets/GitHub-logo.png'],
    title: 'GitHub Actions',
    tag: 'CI/CD',
    section: 'devops',
  },
  {
    id: 'ghcr',
    src: assetModules['../assets/GitHub-logo.png'],
    title: 'GHCR',
    tag: 'Registry',
    section: 'devops',
  },
  {
    id: 'postman',
    src: assetModules['../assets/postman.png'],
    title: 'Postman',
    tag: 'API Test',
    section: 'test',
  },
  {
    id: 'github',
    src: assetModules['../assets/GitHub-logo.png'],
    title: 'GitHub',
    tag: 'Repository',
    section: 'tooling',
  },
  {
    id: 'intellij',
    src: assetModules['../assets/IntelliJ.png'],
    title: 'IntelliJ IDEA',
    tag: 'IDE',
    section: 'tooling',
  },
  {
    id: 'junit-platform',
    src: assetModules['../assets/react.png'],
    title: 'JUnit Platform',
    tag: 'Test',
    section: 'tooling',
  },
].filter((card) => Boolean(card.src));

const pipelineSteps = [
  { id: 'push', title: 'git push', tag: 'Source Update' },
  { id: 'actions', title: 'GitHub Actions', tag: 'CI/CD' },
  { id: 'build', title: 'Build', tag: 'Artifact' },
  { id: 'ghcr', title: 'GHCR', tag: 'Registry' },
  { id: 'deploy', title: 'Deploy', tag: 'Production' },
];

const deploymentNodes = [
  {
    id: 'prod-frontend',
    src: assetModules['../assets/nginx.png'],
    title: 'prod-frontend',
    tag: 'Nginx + React',
  },
  {
    id: 'prod-backend',
    src: assetModules['../assets/spring_boot.png'],
    title: 'prod-backend',
    tag: 'Spring Boot',
  },
  {
    id: 'prod-mysql',
    src: assetModules['../assets/mysql.png'],
    title: 'mysql',
    tag: 'MySQL 8.0',
  },
].filter((card) => Boolean(card.src));

const groupedCards = sectionOrder.map((key) => ({
  key,
  ...sectionMeta[key],
  items: cards.filter((card) => card.section === key),
}));

function ProjectSpecification() {
  return (
    <>
      <GNB />
      <main className="spec-page">
        <section className="spec-shell">
          <section className="spec-hero">
            <span className="spec-hero-pill">TECH STACK</span>
            <h1>Project Specification</h1>
            <p>Java 17 · Spring Boot 4.0.0 · React 19 · MySQL · Docker · AWS Lightsail · GitHub Actions</p>
          </section>

          <section className="spec-grid">
            {groupedCards.map((section) => (
              <article
                key={section.key}
                className={`spec-section-card spec-accent-${section.accent}`}
              >
                <header className="spec-section-header">
                  <div className="spec-section-dot" />
                  <div>
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                  </div>
                </header>

                <div className="spec-card-grid">
                  {section.items.map((item) => (
                    <article className="spec-tech-card" key={item.id}>
                      <div className="spec-tech-logo-wrap">
                        <img src={item.src} alt={item.title} className="spec-tech-logo" />
                      </div>
                      <strong>{item.title}</strong>
                      <span>{item.tag}</span>
                    </article>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="spec-grid">
            <article className="spec-section-card spec-accent-violet">
              <header className="spec-section-header">
                <div className="spec-section-dot" />
                <div>
                  <h2>CI/CD PIPELINE</h2>
                  <p>코드 푸시 이후 GitHub Actions가 빌드하고, 이미지를 GHCR에 저장한 뒤 운영 서버에 배포합니다.</p>
                </div>
              </header>

              <div className="spec-card-grid">
                {pipelineSteps.map((step) => (
                  <article className="spec-tech-card" key={step.id}>
                    <div className="spec-tech-logo-wrap">
                      <strong>{step.id.toUpperCase()}</strong>
                    </div>
                    <strong>{step.title}</strong>
                    <span>{step.tag}</span>
                  </article>
                ))}
              </div>
            </article>

            <article className="spec-section-card spec-accent-rose">
              <header className="spec-section-header">
                <div className="spec-section-dot" />
                <div>
                  <h2>DOCKER PROD-NETWORK</h2>
                  <p>운영 환경에서는 프론트엔드, 백엔드, 데이터베이스 컨테이너가 하나의 네트워크로 연결됩니다.</p>
                </div>
              </header>

              <div className="spec-card-grid">
                {deploymentNodes.map((item) => (
                  <article className="spec-tech-card" key={item.id}>
                    <div className="spec-tech-logo-wrap">
                      <img src={item.src} alt={item.title} className="spec-tech-logo" />
                    </div>
                    <strong>{item.title}</strong>
                    <span>{item.tag}</span>
                  </article>
                ))}
              </div>
            </article>
          </section>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default ProjectSpecification;
