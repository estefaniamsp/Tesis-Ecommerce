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

  // Si no hay ingredientes, no tiene sentido generar
  if (ingredientesDisponibles.length === 0) {
    throw new Error("No hay ingredientes registrados para esta categoría.");
  }

  const nombresDisponibles = ingredientesDisponibles.map(i => i.nombre).join(', ');

  const carritos = await Carritos.find({ cliente_id: clienteId, estado: "completado" })
    .populate({
      path: "productos.producto_id",
      populate: { path: "id_categoria ingredientes" }
    });

  const productosComprados = carritos.flatMap(c =>
    c.productos.map(p => p.producto_id)
  ).filter(p => p?.id_categoria && p.id_categoria._id.equals(categoria._id));

  let prompt = "";

  if (productosComprados.length > 0) {
    const tiposIngredientes = [
      ...new Set(productosComprados.flatMap(p => p.ingredientes.map(i => i.tipo)))
    ];

    prompt = `
El cliente ha comprado productos de la categoría "${categoria.nombre}" y desea un nuevo producto del tipo "${tipo}".

Ingredientes disponibles: ${nombresDisponibles}

Productos anteriores:
${productosComprados.map(p => `${p.nombre}: ${p.descripcion || "sin descripción"}`).join('\n')}

Crea un producto personalizado. RESPONDE SOLO EN FORMATO JSON:
{
  "nombre": string,
  "categoria": string,
  "ingredientes": array de strings (solo de los disponibles),
  "beneficios": array de strings,
  "aroma": string
}
Solo el JSON, sin explicaciones. Máximo 150 tokens.
    `;
  } else {
    prompt = `
El cliente desea un producto personalizado de tipo "${tipo}", categoría "${categoria.nombre}".

Ingredientes disponibles: ${nombresDisponibles}

Crea un producto nuevo y útil. RESPONDE SOLO EN FORMATO JSON:
{
  "nombre": string,
  "categoria": string,
  "ingredientes": array de strings (solo de los disponibles),
  "beneficios": array de strings,
  "aroma": string
}
Solo responde el objeto JSON. Máximo 150 tokens.
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
    console.warn("⚠️ La IA no respondió en formato JSON válido:", textoIA);
    return { texto: textoIA };
  }

  // Match ingredientes por nombre (insensible a mayúsculas)
  const nombresIA = estructuraIA.ingredientes.map(n => n.trim().toLowerCase());

  const ingredientesBD = ingredientesDisponibles.filter(ing =>
    nombresIA.includes(ing.nombre.trim().toLowerCase())
  );

  const precioTotal = ingredientesBD.reduce((total, ing) => total + ing.precio, 0);

  return {
    ...estructuraIA,
    ingredientes: ingredientesBD,
    precio: precioTotal,
    ...(ingredientesBD.length === 0 && {
      advertencia: "⚠️ Ninguno de los ingredientes generados por la IA coincidió con los disponibles."
    })
  };
}

export { recomendarProductoConHF };
