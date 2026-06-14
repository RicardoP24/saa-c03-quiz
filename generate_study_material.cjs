const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

let allQuestions = [];
if (data.tests) {
    data.tests.forEach(test => allQuestions.push(...test.questions));
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function simplifyReason(reason) {
    const match = reason.match(/(.*?[.!?])(?:\s|$)/);
    let str = match ? match[1] : reason;
    if (str.length > 200) str = str.substring(0, 197) + '...';
    return str;
}

const categories = {
    'study-storage-s3': {
        group: 'Armazenamento',
        title: 'S3 e Glacier',
        icon: '💾',
        intro: 'O Amazon S3 e o Amazon S3 Glacier formam a base do armazenamento de objetos na AWS. É crucial saber escolher a "Storage Class" certa.',
        services: [
            { name: 'S3 Standard', theory: 'Armazenamento de objetos de propósito geral, frequentemente acedido. Elevada durabilidade e disponibilidade.', keywords: ['S3 Standard'] },
            { name: 'S3 Standard-IA', theory: 'Acesso Infrequente (Infrequent Access). Tem um custo de armazenamento inferior ao Standard, mas cobra uma taxa pela recuperação dos dados. Ideal para backups.', keywords: ['Standard-IA'] },
            { name: 'S3 Intelligent-Tiering', theory: 'Move os dados automaticamente para o nível de acesso mais económico baseado no padrão de acesso, sem taxas de recuperação.', keywords: ['Intelligent-Tiering'] },
            { name: 'S3 One Zone-IA', theory: 'Armazena dados numa única Zona de Disponibilidade. 20% mais barato que o Standard-IA. Ideal para dados que podem ser recriados.', keywords: ['One Zone-IA', 'One Zone'] },
            { name: 'Glacier Instant Retrieval', theory: 'Acesso a arquivos que raramente são acedidos, mas requerem recuperação na ordem dos milissegundos.', keywords: ['Glacier Instant'] },
            { name: 'Glacier Flexible Retrieval', theory: 'Recuperação de arquivo flexível de 1 minuto a 12 horas. Excelente para backups a longo prazo.', keywords: ['Glacier Flexible', 'Expedited'] },
            { name: 'Glacier Deep Archive', theory: 'Retenção a longo prazo (anos). O armazenamento mais barato da AWS. Tempo de recuperação de 12 a 48 horas.', keywords: ['Deep Archive'] }
        ]
    },
    'study-storage-hybrid': {
        group: 'Armazenamento',
        title: 'Híbrido e Edge (Gateways/Snow)',
        icon: '💾',
        intro: 'A transferência e sincronização de dados entre infraestruturas On-Premises e a AWS é essencial para migrações e workloads híbridos.',
        services: [
            { name: 'File Gateway', theory: 'Oferece uma interface de ficheiros (NFS/SMB) no seu datacenter on-premises que envia e guarda os ficheiros transparentemente como objetos no Amazon S3.', keywords: ['File Gateway', 'SMB', 'NFS'] },
            { name: 'Volume Gateway (Cached)', theory: 'Armazena localmente apenas os dados acedidos recentemente (cache), enquanto mantém os dados primários completos no Amazon S3 (na forma de snapshots EBS).', keywords: ['Volume Gateway', 'Cached Volume'] },
            { name: 'Volume Gateway (Stored)', theory: 'Armazena todos os seus dados primários localmente on-premises para baixa latência de acesso total, enviando assincronamente cópias (backups) para o S3.', keywords: ['Stored Volume'] },
            { name: 'Tape Gateway', theory: 'Substitui backups físicos em fita (Virtual Tape Library - VTL). Faz o backup para o S3 Glacier diretamente.', keywords: ['Tape Gateway', 'VTL'] },
            { name: 'AWS Snowball Edge', theory: 'Dispositivo físico para transferir Terabytes/Petabytes de dados para a AWS offline, evitando estrangulamentos de rede. Versões Storage Optimized e Compute Optimized.', keywords: ['Snowball'] },
            { name: 'AWS Snowcone / Snowmobile', theory: 'Snowcone: pequeno dispositivo resistente (8TB). Snowmobile: camião para transferência a nível de Exabytes.', keywords: ['Snowcone', 'Snowmobile'] }
        ]
    },
    'study-storage-block': {
        group: 'Armazenamento',
        title: 'EBS e EFS',
        icon: '💾',
        intro: 'O armazenamento acoplado às instâncias EC2 e os sistemas de ficheiros partilhados nativos.',
        services: [
            { name: 'EBS (Elastic Block Store)', theory: 'Volumes de blocos virtuais anexados a UMA instância EC2 de cada vez. Presos a uma única Availability Zone.', keywords: ['EBS'] },
            { name: 'EFS (Elastic File System)', theory: 'Sistema de ficheiros POSIX partilhado. Pode ser montado em MÚLTIPLAS instâncias EC2 simultaneamente, através de MÚLTIPLAS AZs. (Apenas Linux).', keywords: ['EFS'] },
            { name: 'Amazon FSx for Windows', theory: 'Servidor de ficheiros nativo Windows na nuvem. Suporta o protocolo SMB, Active Directory e permissões NTFS.', keywords: ['FSx', 'SMB', 'Windows'] },
            { name: 'Amazon FSx for Lustre', theory: 'Sistema de ficheiros partilhado desenhado especificamente para computação de alta performance (HPC) e Machine Learning.', keywords: ['Lustre'] }
        ]
    },
    'study-compute-ec2': {
        group: 'Computação',
        title: 'EC2, Spot e Autoscaling',
        icon: '💻',
        intro: 'A base da computação na AWS, lidando com máquinas virtuais e a sua escalabilidade.',
        services: [
            { name: 'Amazon EC2', theory: 'Servidores virtuais. Deve ser usado quando necessita de acesso total ao Sistema Operativo ou para software legacy.', keywords: ['EC2', 'Instância'] },
            { name: 'Spot Instances', theory: 'Aproveita a capacidade de computação sobressalente da AWS com enormes descontos. Podem ser interrompidas. IDEAL PARA: Workloads tolerantes a falhas e flexíveis.', keywords: ['Spot'] },
            { name: 'Auto Scaling Groups (ASG)', theory: 'Adiciona ou remove instâncias EC2 automaticamente com base em métricas. Essencial para Alta Disponibilidade (espalhar por múltiplas AZs).', keywords: ['Auto Scaling', 'ASG'] },
            { name: 'Application Load Balancer (ALB)', theory: 'Distribui tráfego HTTP/HTTPS (Layer 7). Pode rotear com base no caminho HTTP (ex: /images vai para um grupo) e interagir com Lambdas.', keywords: ['ALB', 'Application Load'] },
            { name: 'Network Load Balancer (NLB)', theory: 'Distribui tráfego TCP/UDP (Layer 4) para altíssima performance, com milhões de pedidos por segundo a latências ultra-baixas.', keywords: ['NLB', 'Network Load'] }
        ]
    },
    'study-compute-serverless': {
        group: 'Computação',
        title: 'Serverless e Containers',
        icon: '💻',
        intro: 'A execução de código e contentores sem a necessidade de provisionar ou gerir infraestrutura subjacente.',
        services: [
            { name: 'AWS Lambda', theory: 'Executa código em resposta a eventos (triggers). Limite máximo de 15 minutos por execução. Perfeito para o "menor esforço operacional".', keywords: ['Lambda', 'Serverless'] },
            { name: 'AWS Fargate', theory: 'Motor de computação serverless para contentores (ECS e EKS). Execute contentores Docker sem ter de gerir as instâncias EC2.', keywords: ['Fargate'] },
            { name: 'Amazon ECS', theory: 'Orquestrador nativo de contentores Docker da AWS.', keywords: ['ECS'] },
            { name: 'Amazon EKS', theory: 'Orquestrador de contentores baseado em Kubernetes.', keywords: ['EKS', 'Kubernetes'] },
            { name: 'Elastic Beanstalk', theory: 'Serviço PaaS para implementar e escalar aplicações web. Forneça o código e a AWS gere o provisionamento.', keywords: ['Elastic Beanstalk', 'Beanstalk'] }
        ]
    },
    'study-db-relational': {
        group: 'Bases de Dados',
        title: 'Relacionais (RDS e Aurora)',
        icon: '🗄️',
        intro: 'Bases de dados transacionais estruturadas com garantias ACID e suporte a SQL.',
        services: [
            { name: 'Amazon RDS', theory: 'Base de dados gerida (MySQL, PostgreSQL, Oracle). Use Multi-AZ para failover automático e Disaster Recovery síncrono. Use Read Replicas para escalar o desempenho de leitura.', keywords: ['RDS', 'Multi-AZ', 'Read Replicas'] },
            { name: 'Amazon Aurora', theory: 'Motor compatível com MySQL/PostgreSQL otimizado para a cloud. Muito mais rápido, guarda 6 cópias dos dados em 3 AZs.', keywords: ['Aurora'] }
        ]
    },
    'study-db-nosql': {
        group: 'Bases de Dados',
        title: 'NoSQL e Analytics',
        icon: '🗄️',
        intro: 'Armazenamento e processamento de dados não-estruturados, análises e armazenamento em memória.',
        services: [
            { name: 'Amazon DynamoDB', theory: 'NoSQL chave-valor. Serverless. Fornece latências previsíveis na ordem dos milissegundos. Ótimo para esquemas de dados JSON sem restrições (schema-less).', keywords: ['DynamoDB', 'Chave-Valor', 'NoSQL'] },
            { name: 'Amazon Redshift', theory: 'Data Warehouse colunar à escala de Petabytes. Ideal para queries de Business Intelligence (BI) lentas e massivas (OLAP).', keywords: ['Redshift', 'Warehouse', 'OLAP'] },
            { name: 'Amazon ElastiCache', theory: 'Motor de caching em memória (Redis ou Memcached). Reduz a latência de leitura e o processamento de base de dados para dados frequentemente acedidos.', keywords: ['ElastiCache', 'Redis', 'Memcached', 'Cache'] }
        ]
    },
    'study-net-vpc': {
        group: 'Redes (VPC)',
        title: 'VPC e Fundamentos',
        icon: '🌐',
        intro: 'A espinha dorsal da segurança de rede na AWS. Como desenhar subnets isoladas.',
        services: [
            { name: 'Amazon VPC', theory: 'A sua rede privada virtual na nuvem da AWS. Subdividida em Subnets públicas (têm rota para o Internet Gateway) e privadas.', keywords: ['VPC', 'Subnet', 'Internet Gateway'] },
            { name: 'NAT Gateway', theory: 'Permite que recursos numa subnet privada façam pedidos outbound para a Internet (ex: atualizar pacotes Linux), mas bloqueia ligações de entrada não solicitadas. Tem de residir numa Subnet Pública.', keywords: ['NAT Gateway', 'NAT Instance'] },
            { name: 'VPC Endpoint (Gateway Endpoint)', theory: 'Permite aceder ao Amazon S3 ou DynamoDB privadamente através da rede interna da AWS, sem passar pela internet ou por um NAT Gateway.', keywords: ['VPC Endpoint', 'Gateway Endpoint'] }
        ]
    },
    'study-net-connectivity': {
        group: 'Redes (VPC)',
        title: 'Conectividade e Peering',
        icon: '🌐',
        intro: 'Conectar múltiplas VPCs e ligar ambientes corporativos on-premises à AWS de forma segura.',
        services: [
            { name: 'VPC Peering', theory: 'Conexão 1-para-1 entre duas VPCs. Não é transitivo (se A liga a B, e B liga a C, A não consegue falar com C através de B).', keywords: ['Peering'] },
            { name: 'AWS Transit Gateway', theory: 'Hub de rede centralizado. Resolve a complexidade de rotas não transitivas. Permite ligar milhares de VPCs e VPNs locais a um router central.', keywords: ['Transit Gateway'] },
            { name: 'AWS Direct Connect', theory: 'Uma ligação física de rede dedicada entre o seu datacenter e a AWS. Latência consistente. Não passa pela internet pública.', keywords: ['Direct Connect'] },
            { name: 'AWS VPN', theory: 'Conexão Site-to-Site segura via túneis IPSec através da internet pública.', keywords: ['VPN', 'IPSec'] }
        ]
    },
    'study-net-edge': {
        group: 'Redes (VPC)',
        title: 'Edge e Entrega de Conteúdo',
        icon: '🌐',
        intro: 'Aproximar o conteúdo e as APIs aos utilizadores finais globalmente para reduzir a latência.',
        services: [
            { name: 'Amazon CloudFront', theory: 'Rede de Distribuição de Conteúdo (CDN). Armazena conteúdo em cache nas Edge Locations em todo o mundo para latência extremamente baixa.', keywords: ['CloudFront', 'Edge'] },
            { name: 'Amazon Route 53', theory: 'Serviço de DNS altamente disponível. Suporta verificações de saúde e roteamento inteligente (Latência, Geo-localização, Failover).', keywords: ['Route 53', 'DNS'] },
            { name: 'AWS Global Accelerator', theory: 'Usa a rede privada da AWS para direcionar utilizadores para endpoints otimizados. Ideal para melhorar a performance de UDP e protocolos não-HTTP globais usando IPs estáticos Anycast.', keywords: ['Global Accelerator', 'Anycast'] },
            { name: 'Amazon API Gateway', theory: 'Gere chamadas à API REST e WebSocket. Protege contra tráfego excessivo (throttling) e integra perfeitamente com o Lambda.', keywords: ['API Gateway', 'REST', 'WebSocket'] }
        ]
    },
    'study-sec-iam': {
        group: 'Segurança',
        title: 'Identidade e Acesso',
        icon: '🔒',
        intro: 'Quem pode fazer o quê e onde. As bases das permissões corporativas.',
        services: [
            { name: 'IAM Roles', theory: 'Evite gravar chaves de acesso! Sempre que um serviço da AWS (ex: EC2) precisa de aceder a outro (ex: S3), assuma uma Role. É temporário e seguro.', keywords: ['IAM Role', 'IAM Policy'] },
            { name: 'AWS Organizations e SCPs', theory: 'Service Control Policies (SCPs) são a única forma de restringir permissões raiz a múltiplas contas AWS (ex: proibir criar VMs no Japão para toda a empresa).', keywords: ['SCP', 'Organizations'] },
            { name: 'Amazon Cognito', theory: 'Fornece gestão de identidade (registo e login via Google, Facebook, etc.) de utilizadores externos (clientes) para a sua aplicação web/mobile.', keywords: ['Cognito', 'Identidade'] }
        ]
    },
    'study-sec-protection': {
        group: 'Segurança',
        title: 'Proteção e Defesa Web',
        icon: '🔒',
        intro: 'Prevenção de intrusões, análise de ameaças e encriptação.',
        services: [
            { name: 'AWS WAF (Web Application Firewall)', theory: 'Defende contra explorações a nível da aplicação (Layer 7), como SQL Injections, Cross-Site Scripting (XSS) e bloqueia listas de IPs em endpoints HTTP.', keywords: ['WAF', 'SQLi', 'XSS', 'Cross-Site'] },
            { name: 'AWS Shield', theory: 'Defesa contra ataques de negação de serviço (DDoS) nas camadas 3 e 4. O Shield Advanced oferece proteção financeira e atua ativamente durante ataques massivos.', keywords: ['Shield', 'DDoS'] },
            { name: 'AWS KMS (Key Management Service)', theory: 'A espinha dorsal para encriptação em repouso (at rest). Cria e gere chaves de encriptação (CMKs).', keywords: ['KMS', 'Encriptação'] },
            { name: 'AWS Secrets Manager', theory: 'Serviço projetado especificamente para gerir, proteger e RODAR AUTOMATICAMENTE segredos (chaves de API, credenciais de BD) usando funções Lambda embutidas.', keywords: ['Secrets Manager', 'Rotação'] },
            { name: 'AWS Systems Manager Parameter Store', theory: 'Armazenamento centralizado para dados de configuração e senhas (SecureString). Não possui funcionalidade nativa de rotação automática de segredos como o Secrets Manager.', keywords: ['Parameter Store', 'Systems Manager', 'SSM'] },
            { name: 'Amazon Macie', theory: 'Serviço de segurança baseado em Machine Learning dedicado a identificar informações confidenciais PII/dados sensíveis expostos em buckets S3.', keywords: ['Macie', 'PII'] },
            { name: 'Amazon GuardDuty', theory: 'Detetor de ameaças inteligente que monitoriza logs do CloudTrail, VPC Flow Logs e consultas de DNS em tempo real para encontrar comportamento anómalo.', keywords: ['GuardDuty', 'Ameaça'] }
        ]
    },
    'study-integration-messaging': {
        group: 'Integração',
        title: 'Desacoplamento e Mensagens',
        icon: '🔄',
        intro: 'Manter arquiteturas flexíveis e resilientes a picos de tráfego usando Pub/Sub e Filas.',
        services: [
            { name: 'Amazon SQS (Simple Queue Service)', theory: 'Serviço de mensagens em fila (Pull). Fundamental para desacoplar componentes (decoupling) e amortecer picos de carga. O SQS FIFO garante que a ordem é mantida exatamente 1 vez.', keywords: ['SQS', 'FIFO', 'Fila'] },
            { name: 'Amazon SNS (Simple Notification Service)', theory: 'Serviço de notificações Pub/Sub (Push). Envia mensagens para múltiplos assinantes simultaneamente (Emails, SMS, ou outras filas SQS "fan-out").', keywords: ['SNS', 'Pub/Sub'] },
            { name: 'AWS Step Functions', theory: 'Máquina de estados visual que orquestra componentes de microsserviços. Ideal para gerir o fluxo longo e condicional de várias funções Lambda.', keywords: ['Step Functions', 'Workflow'] },
            { name: 'Amazon EventBridge', theory: 'Autocarro de eventos (Event Bus). Substituiu o CloudWatch Events. Despoleta reações (ex: acionar um Lambda) sempre que um evento na sua conta ocorre.', keywords: ['EventBridge', 'Event Bus'] },
            { name: 'Amazon Kinesis Data Streams', theory: 'Serviço projetado especificamente para ingerir um volume maciço de dados em fluxo (streaming) em tempo real (ex: logs de IoT ou de clickstream).', keywords: ['Kinesis'] }
        ]
    }
};

const navigationHTML = Object.entries(categories).reduce((acc, [key, cat], idx, arr) => {
    let groupHeader = '';
    if (idx === 0 || arr[idx-1][1].group !== cat.group) {
        groupHeader = `\n<div class="nav-group">${cat.group}</div>\n`;
    }
    return acc + groupHeader + `<a href="${key}.html" id="link-${key}" class="sub-link">${cat.title}</a>\n`;
}, '');

Object.entries(categories).forEach(([pageKey, pageCat]) => {
    
    pageCat.services.forEach(svc => {
        svc.extractedReasons = new Set();
    });

    allQuestions.forEach(q => {
        const correctOpt = q.options[q.answer] || '';
        const textToSearch = (correctOpt + ' ' + q.reason).toLowerCase();
        const fullReason = q.reason;
        
        for (const svc of pageCat.services) {
            for (const kw of svc.keywords) {
                // escape special characters for regex
                const escapedKw = kw.toLowerCase().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
                const regex = new RegExp('\\b' + escapedKw + '\\b', 'i');
                if (regex.test(textToSearch)) {
                    svc.extractedReasons.add(simplifyReason(fullReason));
                    break;
                }
            }
        }
    });

    let tableRows = '';
    pageCat.services.forEach(svc => {
        const practicalList = Array.from(svc.extractedReasons);
        let practicalHTML = '';
        if (practicalList.length > 0) {
            practicalHTML = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <strong style="color:var(--primary); font-size: 0.85rem; text-transform:uppercase;">Casos Práticos do Simulado:</strong>
                    <ul class="use-case-list" style="margin-top: 0.5rem;">
                        ${practicalList.map(uc => `<li>${escapeHtml(uc)}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
             practicalHTML = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                    <em style="color:var(--text-muted); font-size: 0.85rem;">Teoria fundamental para o exame. Não testado diretamente nos seus simulados.</em>
                </div>
            `;
        }

        tableRows += `
            <tr>
                <td class="service-name"><strong>${svc.name}</strong></td>
                <td>
                    <p style="color: var(--text-main); font-weight: 500;">${escapeHtml(svc.theory)}</p>
                    ${practicalHTML}
                </td>
            </tr>
        `;
    });

    const finalNavigationHTML = navigationHTML.replace(`id="link-${pageKey}" class="sub-link"`, `id="link-${pageKey}" class="sub-link active"`);

    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageCat.title} - Guia AWS SAA-C03</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        .study-section { background: var(--card-bg); backdrop-filter: blur(10px); padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--glass-border); box-shadow: var(--shadow); margin-bottom: 2rem; }
        .study-section h2 { color: var(--primary); margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.5rem; }
        .study-section p { line-height: 1.6; color: var(--text-muted); margin-bottom: 1.5rem; }
        .table-container { overflow-x: auto; margin-bottom: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--glass-border); }
        table { width: 100%; border-collapse: collapse; text-align: left; background: rgba(255, 255, 255, 0.02); }
        th, td { padding: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); color: var(--text-muted); vertical-align: top; }
        th { background: rgba(255, 255, 255, 0.05); color: var(--primary); font-weight: 600; font-size: 1.1rem; }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(255, 255, 255, 0.05); color: var(--text-main); }
        .service-name { color: var(--primary); font-size: 1.1rem; white-space: nowrap; width: 25%; }
        .use-case-list { padding-left: 1.5rem; margin: 0; }
        .use-case-list li { margin-bottom: 0.75rem; line-height: 1.5; font-size: 0.95rem;}
        .use-case-list li:last-child { margin-bottom: 0; }
    </style>
</head>
<body>
    <div id="app" class="study-app">
        <header>
            <div class="logo-container">
                <div class="logo-icon">${pageCat.icon}</div>
                <h1>Deep-Dive Definitivo SAA-C03</h1>
            </div>
            <div class="controls-top">
                <button onclick="window.location.href='index.html'" class="secondary-btn">← Voltar aos Simulados</button>
            </div>
        </header>

        <div class="study-layout">
            <aside class="sidebar">
                <h3>Módulos de Estudo</h3>
                <nav>
                    <a href="study.html" class="sub-link">Visão Geral Principal</a>
                    ${finalNavigationHTML}
                </nav>
            </aside>

            <main class="study-content">
                <section class="study-section">
                    <h2>${pageCat.group}: ${pageCat.title}</h2>
                    <p>${pageCat.intro}</p>
                    
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Serviço AWS</th>
                                    <th>Definição Teórica e Aplicações Práticas</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(path.join(__dirname, `${pageKey}.html`), htmlTemplate, 'utf8');
});

// GENERATE MAIN HUB (study.html)
let moduleCardsHTML = '';
Object.entries(categories).forEach(([pageKey, pageCat]) => {
    moduleCardsHTML += `
        <a href="${pageKey}.html" class="module-card">
            <span class="module-icon">${pageCat.icon}</span>
            <h4>${pageCat.title}</h4>
            <p>${pageCat.group}</p>
        </a>
    `;
});

const hubNavigationHTML = navigationHTML;

const studyHubTemplate = `<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guia de Estudo - AWS SAA-C03</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        .study-section { background: var(--card-bg); backdrop-filter: blur(10px); padding: 2rem; border-radius: 1.5rem; border: 1px solid var(--glass-border); box-shadow: var(--shadow); margin-bottom: 2rem; }
        .study-section h2 { color: var(--primary); margin-bottom: 1.5rem; font-size: 1.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 0.5rem; }
        .study-section p { line-height: 1.6; color: var(--text-muted); margin-bottom: 1rem; }
        .module-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1.5rem; }
        .module-card { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); padding: 1.5rem; border-radius: 1rem; transition: all 0.2s ease; text-decoration: none; color: inherit; }
        .module-card:hover { border-color: var(--primary); transform: translateY(-5px); background: rgba(255, 153, 0, 0.05); }
        .module-icon { font-size: 2rem; margin-bottom: 1rem; display: block; }
        .module-card h4 { color: var(--text-main); margin-bottom: 0.5rem; }
        .exam-tip { background: rgba(245, 158, 11, 0.1); border-left: 4px solid var(--primary); padding: 1rem; border-radius: 0 0.5rem 0.5rem 0; margin: 1.5rem 0; font-style: italic; color: #fcd34d; }
        .exam-tip strong { color: var(--primary); text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; display: block; margin-bottom: 0.5rem; }
    </style>
</head>
<body>
    <div id="app" class="study-app">
        <header>
            <div class="logo-container">
                <div class="logo-icon">📚</div>
                <h1>Guia de Estudo SAA-C03 (Deep-Dive)</h1>
            </div>
            <div class="controls-top">
                <button onclick="window.location.href='index.html'" class="secondary-btn">← Voltar aos Simulados</button>
            </div>
        </header>

        <div class="study-layout">
            <aside class="sidebar">
                <h3>Módulos de Estudo</h3>
                <nav>
                    <a href="study.html" class="active sub-link" style="padding-left:0.5rem !important;">Visão Geral</a>
                    ${hubNavigationHTML}
                </nav>
            </aside>

            <main class="study-content">
                <section class="study-section">
                    <h2>Bem-vindo ao Guia Definitivo</h2>
                    <p>Este hub contém todo o currículo AWS SAA-C03, atualizado para englobar não só a teoria fundamental, mas também as centenas de cenários práticos identificados nos seus simulados.</p>
                    
                    <div class="exam-tip">
                        <strong>Dica de Estudo</strong>
                        No exame SAA-C03, preste especial atenção a palavras-chave como <strong>"custo mais baixo"</strong>, <strong>"alta disponibilidade"</strong> e <strong>"menor esforço operacional"</strong> para decidir entre serviços semelhantes.
                    </div>

                    <h3>Módulos Disponíveis</h3>
                    <div class="module-grid">
                        ${moduleCardsHTML}
                    </div>
                </section>
            </main>
        </div>
    </div>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, 'study.html'), studyHubTemplate, 'utf8');

console.log(Object.keys(categories).length + ' páginas secundárias e o hub principal gerados com sucesso!');
