import Carritos from '../models/carritos.js';
import Ingrediente from '../models/ingredientes.js';
import Categoria from '../models/categorias.js';
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.TOKEN_HUGGINGFACE);

async function recomendarProductoConHF(clienteId, tipo, id_categoria) {
  const categoria = await Categoria.findById(id_categoria);
  if (!categoria) {
    throw new Error("La categoría indicada no existe.");
  }

  // Obtener todos los ingredientes disponibles para esa categoría
  const ingredientesDisponibles = await Ingrediente.find({ id_categoria: categoria._id });

  if (ingredientesDisponibles.length === 0) {
    throw new Error("No hay ingredientes registrados para esta categoría.");
  }

  // Agrupar ingredientes por tipo
  const ingredientesAgrupados = ingredientesDisponibles.reduce((acc, ing) => {
    const tipo = ing.tipo.toLowerCase();
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(ing.nombre);
    return acc;
  }, {});

  const carritos = await Carritos.find({ cliente_id: clienteId, estado: "completado" })
    .populate({
      path: "productos.producto_id",
      populate: { path: "id_categoria ingredientes" }
    });

  const productosComprados = carritos.flatMap(c =>
    c.productos.map(p => p.producto_id)
  ).filter(p => p?.id_categoria && p.id_categoria._id.equals(categoria._id));

  let prompt = "";

  const listaIngredientes = Object.entries(ingredientesAgrupados)
    .map(([tipo, nombres]) => `${tipo}: ${nombres.join(', ')}`)
    .join('\n');

  if (productosComprados.length > 0) {
    prompt = `
El cliente ha comprado productos de la categoría "${categoria.nombre}" y desea un nuevo producto del tipo "${tipo}".

Ingredientes disponibles (agrupados por tipo):
${listaIngredientes}

Productos anteriores:
${productosComprados.map(p => `${p.nombre}: ${p.descripcion || "sin descripción"}`).join('\n')}

Genera un producto personalizado en formato JSON:
{
  "nombre": string,
  "categoria": string,
  "ingredientes": {
    "molde": string,
    "esencia": string,
    "colorante": string
  },
  "beneficios": array de strings,
  "aroma": string
}

 Solo responde el objeto JSON. Usa solo ingredientes disponibles. Máximo 150 tokens.
    `;
  } else {
    prompt = `
El cliente desea un producto personalizado de tipo "${tipo}", categoría "${categoria.nombre}".

Ingredientes disponibles (agrupados por tipo):
${listaIngredientes}

Genera un producto creativo y útil en formato JSON:
{
  "nombre": string,
  "categoria": string,
  "ingredientes": {
    "molde": string,
    "esencia": string,
    "colorante": string
  },
  "beneficios": array de strings,
  "aroma": string
}

 Solo responde el objeto JSON. Usa solo ingredientes disponibles. Máximo 150 tokens.
    `;
  }

  const response = await hf.chatCompletion({
    model: "meta-llama/Llama-3.1-8B-Instruct",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 150,
    temperature: 0.7,
  });

  const textoIA = response.choices?.[0]?.message?.content || "";

  let estructuraIA;
  try {
    estructuraIA = JSON.parse(textoIA);
  } catch (e) {
    console.warn("La IA no respondió en formato JSON válido:", textoIA);
    return { texto: textoIA };
  }

  // Match de ingredientes por tipo y nombre
  const nombresIA = Object.entries(estructuraIA.ingredientes).map(
    ([tipo, nombre]) => ({ tipo, nombre: nombre.trim().toLowerCase() })
  );

  let ingredientesBD = ingredientesDisponibles.filter(ing =>
    nombresIA.some(
      entrada =>
        ing.tipo.toLowerCase() === entrada.tipo &&
        ing.nombre.trim().toLowerCase() === entrada.nombre
    )
  );

  // Asegurar que siempre haya molde, esencia y colorante
  const tiposRequeridos = ["molde", "esencia", "colorante"];

  for (const tipo of tiposRequeridos) {
    const yaIncluido = ingredientesBD.some(ing => ing.tipo.toLowerCase() === tipo);
    if (!yaIncluido) {
      const opciones = ingredientesDisponibles.filter(ing => ing.tipo.toLowerCase() === tipo);
      if (opciones.length > 0) {
        const random = opciones[Math.floor(Math.random() * opciones.length)];
        ingredientesBD.push(random);
      }
    }
  }

  const precioTotal = ingredientesBD.reduce((total, ing) => total + ing.precio, 0);

  return {
    ...estructuraIA,
    ingredientes: ingredientesBD.map(ing => {
      const { stock, createdAt, updatedAt, __v, ...resto } = ing.toObject();
      return resto;
    }),
    precio: precioTotal,
    ...(ingredientesBD.length === 0 && {
      advertencia: "Ninguno de los ingredientes generados por la IA coincidió con los disponibles."
    })
  };
}

export { recomendarProductoConHF };
