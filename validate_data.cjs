const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public', 'data.json');

if (!fs.existsSync(dataPath)) {
    console.error('Erro: public/data.json não encontrado!');
    process.exit(1);
}

try {
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const quizData = JSON.parse(rawData);
    
    if (!quizData.tests || !Array.isArray(quizData.tests)) {
        throw new Error('Propriedade "tests" está em falta ou não é um Array');
    }
    
    console.log(`Número de simulados: ${quizData.tests.length}`);
    
    let totalQuestions = 0;
    quizData.tests.forEach((test, idx) => {
        console.log(`\nAvaliar Simulado ${test.id} - "${test.title}"...`);
        if (!test.questions || !Array.isArray(test.questions)) {
            throw new Error(`Simulado ${test.id} não possui um array de "questions"`);
        }
        
        console.log(`Número de questões: ${test.questions.length}`);
        totalQuestions += test.questions.length;
        
        test.questions.forEach((q, qIdx) => {
            const label = `Questão ${q.number} (Índice ${qIdx} no Simulado ${test.id})`;
            
            if (typeof q.number !== 'number') {
                throw new Error(`${label}: campo "number" inválido`);
            }
            if (!q.text || typeof q.text !== 'string' || q.text.trim() === '') {
                throw new Error(`${label}: campo "text" está em falta ou vazio`);
            }
            if (!q.options || typeof q.options !== 'object' || Array.isArray(q.options)) {
                throw new Error(`${label}: campo "options" deve ser um objeto`);
            }
            
            // Check options keys (must be A, B, C, D)
            const optionKeys = Object.keys(q.options);
            if (optionKeys.length !== 4) {
                throw new Error(`${label}: número incorreto de opções (${optionKeys.length} em vez de 4)`);
            }
            ['A', 'B', 'C', 'D'].forEach(key => {
                if (!q.options[key] || typeof q.options[key] !== 'string' || q.options[key].trim() === '') {
                    throw new Error(`${label}: opção "${key}" está em falta ou vazia`);
                }
            });
            
            if (!q.answer || !['A', 'B', 'C', 'D'].includes(q.answer)) {
                throw new Error(`${label}: campo "answer" inválido ou em falta: "${q.answer}"`);
            }
            
            if (!q.reason || typeof q.reason !== 'string' || q.reason.trim() === '') {
                throw new Error(`${label}: campo "reason" está em falta ou vazio`);
            }
            
            if (!q.distractors || typeof q.distractors !== 'string' || q.distractors.trim() === '') {
                throw new Error(`${label}: campo "distractors" está em falta ou vazio`);
            }
        });
        
        console.log(`-> Simulado ${test.id} OK!`);
    });
    
    console.log(`\nValidação Completa! Total de questões: ${totalQuestions}`);
    if (totalQuestions !== 300) {
        throw new Error(`Número total de questões incorreto! Esperava 300, obteve ${totalQuestions}`);
    }
    console.log('SUCESSO: A base de dados data.json está 100% válida e íntegra!');
} catch (error) {
    console.error('FALHA NA VALIDAÇÃO:', error.message);
    process.exit(1);
}
