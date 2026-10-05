import { Comment } from "../models/Comment.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";

/** Inicializa tres comentarios principales con una respuesta cada uno por reseña. */
export async function initializeComments(users, reviews, options = {}) {
  const records = [];

  async function saveComment(data, legacyBody) {
    await Comment.build(data).validate();
    if (!await Review.findByPk(data.review_id, options)) throw new Error("Invalid reference: Comment.review_id");
    if (!await User.findByPk(data.user_id, options)) throw new Error("Invalid reference: Comment.user_id");
    const where = { review_id: data.review_id, user_id: data.user_id, body: data.body };
    // Reconoce textos anteriores del init y conserva sus IDs, likes y notificaciones.
    for (const body of [].concat(legacyBody ?? [])) {
      const legacy = await Comment.findOne({ where: { ...where, body }, ...options });
      if (legacy) await legacy.update({ body: data.body }, options);
    }
    const [record] = await Comment.findOrCreate({
      where, defaults: { parent_comment_id: data.parent_comment_id, is_active: true }, ...options,
    });
    await record.update({ body: data.body }, options);
    await record.validate();
    if (record.parent_comment_id != null) {
      const parent = await Comment.findByPk(record.parent_comment_id, options);
      if (!parent) throw new Error("Invalid reference: Comment.parent_comment_id");
      if (parent.review_id !== record.review_id || parent.id === record.id) {
        throw new Error("A reply must belong to its parent's review and cannot reply to itself");
      }
    }
    records.push(record);
    return record;
  }

  // Cada entrada contiene reseña, autor del comentario, pregunta y respuesta del autor de la reseña.
  const threads = [
    [
        0,
        1,
        "¿El panel transparente de este PC azul facilita ordenar los cables y revisar los ventiladores?",
        "Sí, en esta torre de escritorio puedo ver los componentes y acomodar los cables antes de cerrar el panel. Para limpiar el PC siempre lo apago y desconecto.",
        [
            "¿Son cómodos para usarlos varias horas?",
            "¿La torre deja suficiente espacio para ordenar los cables y limpiar los ventiladores?"
        ],
        [
            "Sí, los uso durante toda la jornada.",
            "Sí, pude acomodar los cables por el lateral y revisar el interior sin desmontar todo el equipo."
        ]
    ],
    [
        2,
        2,
        "¿Los ventiladores azules de la torre distraen cuando usas el PC de noche?",
        "Con la habitación oscura la iluminación azul del PC se nota bastante; prefiero encender una lámpara suave junto al monitor.",
        [
            "Gracias por compartir tu experiencia.",
            "¿La iluminación azul resulta molesta cuando usas el PC de noche?"
        ],
        [
            "Me alegra que te haya servido.",
            "Con la habitación completamente oscura se nota bastante; prefiero dejar una luz suave en el escritorio."
        ]
    ],
    [
        0,
        2,
        "¿Usas este PC de escritorio para programar mientras estás en una videollamada?",
        "Sí, para mis clases abro el editor y la llamada en este PC. Tener el monitor y el teclado siempre conectados me hace más cómoda la rutina.",
        [
            "¿Cómo te va al programar mientras tienes varias pestañas y una videollamada abiertas?"
        ],
        [
            "Para mis clases y proyectos pequeños ha sido cómodo; puedo cambiar entre las aplicaciones sin interrumpir la llamada."
        ]
    ],
    [
        0,
        1,
        "Me gusta la torre azul con paneles transparentes. ¿Dónde pusiste el PC para que ventile bien?",
        "Puse el PC sobre el escritorio y dejé espacio libre alrededor de la torre, especialmente junto a los ventiladores y las entradas de aire.",
        [
            "Me gusta el panel transparente. ¿Dónde colocaste el PC para que tenga buena ventilación?"
        ],
        [
            "Lo dejé sobre el escritorio, separado de la pared y con espacio libre a los lados de la torre."
        ]
    ],
    [
        1,
        1,
        "¿Las copas acolchadas de estos audífonos negros son cómodas durante una sesión larga de estudio?",
        "Las almohadillas de los audífonos me resultan cómodas, pero después de varias horas hago una pausa para descansar las orejas y evitar el calor.",
        [
            "¿Las almohadillas siguen siendo cómodas después de una sesión larga de estudio?"
        ],
        [
            "A mí me resultan cómodas, aunque cada cierto tiempo hago una pausa para descansar las orejas."
        ]
    ],
    [
        1,
        2,
        "¿Puedes encontrar los controles laterales de los audífonos sin quitártelos?",
        "Sí, después de usarlos unos días aprendí la posición de los botones de la copa. Ahora pauso la música sin quitarme los audífonos negros.",
        [
            "¿Los controles del lateral son fáciles de encontrar sin quitarte los audífonos?"
        ],
        [
            "Después de un par de días me acostumbré a la posición; ahora pauso la música sin tener que mirarlos."
        ]
    ],
    [
        1,
        1,
        "¿Llevarías estos audífonos de diadema a la universidad dentro del bolso?",
        "Los audífonos ocupan bastante espacio. Los llevaría con una funda y un bolso amplio; para salir con poco equipaje prefiero unos más pequeños.",
        [
            "¿Los llevarías en un bolso para ir a la universidad o los dejarías en casa?"
        ],
        [
            "Los llevaría si tengo espacio y una funda; para un bolso pequeño prefiero algo menos voluminoso."
        ]
    ],
    [
        2,
        0,
        "¿El panel transparente de la torre azul permite ver cuándo hay que limpiar el PC?",
        "Sí, a través del panel del PC veo el polvo en el interior y los ventiladores. Antes de limpiar apago y desconecto la torre.",
        [
            "¿El panel transparente te ayuda a saber cuándo toca limpiar el interior?"
        ],
        [
            "Sí, permite ver el polvo acumulado y revisar los ventiladores; siempre apago y desconecto el PC antes de limpiarlo."
        ]
    ],
    [
        2,
        2,
        "¿Te resulta cómodo tener este PC azul como equipo fijo para las clases y las partidas?",
        "Sí, con este PC dejo el monitor, el teclado y los demás accesorios listos en el escritorio. La torre ocupa espacio, pero no tengo que reconectarlo todo cada día.",
        [
            "¿Qué te parece usar una torre así como equipo fijo para estudiar y jugar?"
        ],
        [
            "Me resulta práctico tener todo conectado en el escritorio, aunque ocupa más espacio que un portátil."
        ]
    ],
    [
        3,
        0,
        "¿Avisaste a tus compañeros antes de activar la grieta portátil de Fortnite?",
        "Sí, antes de usar la grieta avisamos por voz y marcamos una zona de aterrizaje. En Fortnite coordinar ese movimiento nos ayudó a quedar juntos.",
        [
            "¿Avisaste a tus compañeros antes de activar la grieta o cada uno salió por su cuenta?"
        ],
        [
            "Les avisé por voz y elegimos una zona juntos; coordinar el aterrizaje hizo mucho más útil la jugada."
        ]
    ],
    [
        3,
        2,
        "¿Guardarías la grieta de Fortnite para escapar de la tormenta o para reposicionarte en una pelea?",
        "En esa partida usamos la grieta para salir de la tormenta. También la reservaría para cambiar de posición en Fortnite si tenemos claro dónde aterrizar.",
        [
            "¿La usarías para escapar de la tormenta o para buscar una posición mejor en una pelea?"
        ],
        [
            "En esa partida la usé para escapar, pero también puede ayudar a cambiar de posición si ya tienes un destino pensado."
        ]
    ],
    [
        3,
        0,
        "La esfera azul de la grieta de Fortnite se ve genial. ¿Qué fue lo más difícil al activarla?",
        "Al usar la grieta lo más difícil fue elegir rápido un aterrizaje seguro. No conviene quedarse mirando la animación de Fortnite y olvidarse de los otros equipos.",
        [
            "El efecto azul de la esfera se ve buenísimo. ¿Qué fue lo más difícil al usarla?"
        ],
        [
            "Decidir rápido dónde aterrizar; mirar solo la animación y olvidarse del entorno puede dejarte cerca de otro equipo."
        ]
    ],
    [
        4,
        0,
        "¿La diadema de estos audífonos negros se ajusta sin apretar demasiado?",
        "En mi caso pude acomodar la diadema y las copas de los audífonos para que quedaran firmes. Aun así hago descansos durante las sesiones largas.",
        [
            "¿La diadema permite ajustarlos bien sin que aprieten demasiado?"
        ],
        [
            "En mi caso encontré un ajuste cómodo; conviene probar la posición de las copas antes de usarlos durante varias horas."
        ]
    ],
    [
        4,
        1,
        "¿Cómo se escuchan las voces de los videos con estos audífonos de diadema?",
        "Las voces se entienden bien con los audífonos a un volumen moderado. Los uso para seguir videos mientras trabajo junto al computador.",
        [
            "¿Qué tal se entienden las voces cuando ves videos o escuchas una conversación?"
        ],
        [
            "Las voces me resultan claras a un volumen moderado y no necesito subirlo demasiado para seguir los videos."
        ]
    ],
    [
        4,
        0,
        "¿Las almohadillas de los audífonos negros dan calor después de escuchar un álbum completo?",
        "Después de un rato largo noto calor en las copas de los audífonos, así que los dejo unos minutos sobre el escritorio antes de seguir con la música.",
        [
            "¿Se vuelven incómodos por el calor después de escuchar un álbum completo?"
        ],
        [
            "Después de mucho rato noto algo de calor, así que hago una pausa corta antes de seguir escuchando música."
        ]
    ],
    [
        5,
        0,
        "¿Qué cambiarías al usar la grieta de Fortnite después de aterrizar cerca de otro equipo?",
        "Antes de activar la grieta marcaría una zona menos concurrida. Durante el descenso en Fortnite miraría alrededor para corregir el aterrizaje y reunirme con mis compañeros.",
        [
            "¿Qué harías distinto después de aterrizar cerca de otro equipo?"
        ],
        [
            "Marcaría primero una zona menos concurrida y miraría alrededor durante el descenso para poder corregir el destino."
        ]
    ],
    [
        5,
        1,
        "¿Aprovechas más la grieta portátil de Fortnite cuando juegas en equipo?",
        "Sí, con un equipo coordinado la grieta nos ayuda a movernos juntos. En Fortnite prefiero acordar el destino para que nadie aterrice solo lejos del resto.",
        [
            "¿La grieta te parece más útil jugando en equipo o cuando vas por tu cuenta?"
        ],
        [
            "Con un equipo coordinado le saco más partido, porque podemos reagruparnos y decidir el siguiente movimiento juntos."
        ]
    ],
    [
        5,
        0,
        "¿Usarías la grieta de Fortnite apenas aparece un problema o la guardarías para una situación difícil?",
        "Guardaría la grieta hasta tener una razón clara para movernos y un destino seguro. Activarla sin plan en Fortnite puede sacarnos de un problema y dejarnos en otra pelea.",
        [
            "¿Vale la pena usarla apenas aparece un problema o guardarla para un momento más complicado?"
        ],
        [
            "Yo la guardaría hasta tener una razón clara para moverme; usarla sin plan puede cambiar un problema por otro."
        ]
    ]
];
  for (const [reviewIndex, userIndex, question, answer, legacyQuestion, legacyAnswer] of threads) {
    const review = reviews[reviewIndex];
    const parent = await saveComment({
      review_id: review.id, user_id: users[userIndex].id,
      body: question, parent_comment_id: null, is_active: true,
    }, legacyQuestion);
    await saveComment({
      review_id: review.id, user_id: review.user_id,
      body: answer, parent_comment_id: parent.id, is_active: true,
    }, legacyAnswer);
  }
  return records;
}
