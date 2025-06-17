import Ventas from '../models/ventas.js';
import Ingrediente from '../models/ingredientes.js';
import Categoria from '../models/categorias.js';
import VistaProducto from '../models/vistaProducto.js';
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.TOKEN_HUGGINGFACE);

async function recomendarProductoConHF(clienteId, tipo, id_categoria) {
  const categoria = await Categoria.findById(id_categoria);
  if (!categoria) throw new Error("La categoría indicada no existe.");

  const ingredientesDisponibles = await Ingrediente.find({ id_categoria: id_categoria });
  if (ingredientesDisponibles.length === 0) throw new Error("No hay ingredientes disponibles para esta categoría.");

  const ingredientesAgrupados = ingredientesDisponibles.reduce((acc, ing) => {
    const tipo = ing.tipo.toLowerCase();
    if (!acc[tipo]) acc[tipo] = [];
    acc[tipo].push(ing.nombre);
    return acc;
  }, {});

  const ventas = await Ventas.find({ cliente_id: clienteId, estado: "finalizado" })
    .populate({ path: "productos.producto_id", populate: { path: "id_categoria ingredientes" } });

  const productosComprados = ventas.flatMap(v => v.productos.map(p => p.producto_id))
    .filter(p => p?.id_categoria && p.id_categoria._id.equals(id_categoria));

  let productosBase = productosComprados;

  if (productosBase.length === 0) {
    const vistas = await VistaProducto.find({ cliente_id: clienteId })
      .sort({ createdAt: -1 })
      .populate("producto_id");

    productosBase = vistas.map(v => v.producto_id)
      .filter(p => p?.id_categoria && p.id_categoria.equals(id_categoria));
  }

  const listaIngredientes = Object.entries(ingredientesAgrupados)
    .map(([tipo, nombres]) => `${tipo}: ${nombres.join(', ')}`)
    .join('\n');

  let prompt = `
El cliente desea un producto de tipo "${tipo}" en la categoría "${categoria.nombre}".

Ingredientes disponibles (agrupados por tipo):
${listaIngredientes}
`;

  if (productosBase.length > 0) {
    prompt += `Historial del cliente:
${productosBase.map(p => `${p.nombre}: ${p.descripcion || "sin descripción"}`).join('\n')}
`;
  }

  prompt += `\nGenera un producto personalizado en formato JSON:
{
  "nombre": string,
  "categoria": string,
  "ingredientes": {
    "molde": string,
    "color": string,
    "esencia1": string,
    "esencia2": string
  },
  "beneficios": array de strings,
  "aroma": string
}
Solo responde el objeto JSON. Usa solo ingredientes disponibles. Máximo 150 tokens.`;

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

  const nombresIA = Object.entries(estructuraIA.ingredientes).map(
    ([tipo, nombre]) => ({ tipo, nombre: nombre.trim().toLowerCase() })
  );

  if (estructuraIA.aroma) {
    nombresIA.push({ tipo: "aroma", nombre: estructuraIA.aroma.trim().toLowerCase() });
  }

  let ingredientesBD = ingredientesDisponibles.filter(ing =>
    nombresIA.some(entrada =>
      ing.tipo.toLowerCase().includes(entrada.tipo.toLowerCase()) &&
      ing.nombre.trim().toLowerCase() === entrada.nombre
    )
  );

  const tiposRequeridos = ["molde", "color", "aroma"];
  tiposRequeridos.forEach(tipo => {
    const existe = ingredientesBD.some(ing => ing.tipo.toLowerCase() === tipo);
    if (!existe) {
      const candidatos = ingredientesDisponibles.filter(ing => ing.tipo.toLowerCase() === tipo);
      if (candidatos.length > 0) ingredientesBD.push(candidatos[Math.floor(Math.random() * candidatos.length)]);
    }
  });

  const esenciasIncluidas = ingredientesBD.filter(ing => ing.tipo.toLowerCase() === "esencia");
  const faltantesEsencias = ingredientesDisponibles.filter(
    ing => ing.tipo.toLowerCase() === "esencia" && !esenciasIncluidas.includes(ing)
  );
  while (esenciasIncluidas.length < 2 && faltantesEsencias.length > 0) {
    ingredientesBD.push(faltantesEsencias.pop());
  }

  const molde = ingredientesBD.find(i => i.tipo.toLowerCase() === "molde");
  const color = ingredientesBD.find(i => i.tipo.toLowerCase() === "color");
  const aroma = ingredientesBD.find(i => i.tipo.toLowerCase() === "aroma");
  const esenciasFinal = ingredientesBD.filter(i => i.tipo.toLowerCase() === "esencia").slice(0, 2);

  const precioTotal = ingredientesBD.reduce((total, ing) => total + ing.precio, 0);

  return {
    msg: "Producto personalizado creado exitosamente",
    producto_personalizado: {
      categoria: categoria.nombre.toLowerCase(),
      tipo: tipo,
      aroma: aroma && {
        _id: aroma._id,
        nombre: aroma.nombre,
        imagen: aroma.imagen
      },
      molde: molde && {
        _id: molde._id,
        nombre: molde.nombre,
        imagen: molde.imagen
      },
      color: color && {
        _id: color._id,
        nombre: color.nombre,
        imagen: color.imagen
      },
      esencias: esenciasFinal.map(e => ({
        _id: e._id,
        nombre: e.nombre,
        imagen: e.imagen
      })),
      precio: precioTotal
    }
  };
}

export { recomendarProductoConHF };