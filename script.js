// Türkiye merkezli harita oluştur
const map = new ol.Map({
    target: 'map', // Haritanın yerleştirileceği HTML elementi
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM({
                attributions: [] // OSM kaynak attributions
            })
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([35.2433, 39.0997]), // Türkiye'nin merkez koordinatları
        zoom: 6.5 // Başlangıç zoom seviyesi
    })
});

// Çizilen şekilleri tutacak vektör katmanı
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource // Vektör katmanını kaynak olarak ayarla
});
map.addLayer(vectorLayer); // Haritaya vektör katmanını ekle

// WKT Formatını okuyabilmek için gerekli kütüphane
const format = new ol.format.WKT();

// Geometrileri API'den yükleyen fonksiyon
function loadGeometries() {
    fetch('http://localhost:5296/api/Geometries') // Geometrilerin alınacağı API
        .then(response => response.json())
        .then(responseData => {
            console.log('Sunucudan gelen geometriler:', responseData);
            const data = responseData.data; // Gelen veriyi al
            if (Array.isArray(data)) {
                vectorSource.clear(); // Önceki geometrileri temizle
                data.forEach(item => {
                    try {
                        const wkt = item.geometry; // WKT geometrisini al
                        const feature = format.readFeature(wkt, {
                            dataProjection: 'EPSG:3857',
                            featureProjection: 'EPSG:3857'
                        });

                        if (feature) {
                            feature.setId(item.id); // Şeklin ID'sini ayarla

                            // Şekil türüne göre stil belirle
                            const geometryType = feature.getGeometry().getType();
                            switch (geometryType) {
                                case 'Point':
                                    feature.setStyle(markerStyle); // Nokta stili
                                    break;
                                case 'LineString':
                                    feature.setStyle(lineStyle); // Çizgi stili
                                    break;
                                case 'Polygon':
                                    feature.setStyle(polygonStyle); // Poligon stili
                                    break;
                                case 'Circle':
                                    feature.setStyle(circleStyle); // Daire stili
                                    break;
                                default:
                                    console.error('Geometrinin türü tanımlanmadı:', geometryType);
                                    break;
                            }

                            vectorSource.addFeature(feature); // Vektör kaynağına ekle
                        } else {
                            console.error('WKT geometri işlenemedi:', wkt);
                        }
                    } catch (error) {
                        console.error('WKT verisi işlenirken hata:', error);
                    }
                });
            } else {
                console.error('API bir dizi geometrisi döndürmedi:', data);
            }
        })
        .catch(error => {
            console.error('Şekiller yüklenirken hata:', error);
        });
}


// Şekil çizim işlemi için gerekli değişkenler
let draw;
let selectedShapeType = 'POINT'; // Varsayılan şekil türü
let currentFeature; // Geçerli şekil

// Daireyi poligona dönüştüren fonksiyon
function circleToPolygon(circleFeature) {
    const circleGeometry = circleFeature.getGeometry();
    const center = circleGeometry.getCenter();
    const radius = circleGeometry.getRadius();
    const numPoints = 64; // Dairenin nokta sayısı
    const coordinates = [];

    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        coordinates.push([
            center[0] + radius * Math.cos(angle),
            center[1] + radius * Math.sin(angle)
        ]);
    }
    coordinates.push(coordinates[0]); // Dairenin kapatılması
    return new ol.geom.Polygon([coordinates]); // Poligon olarak döndür
}
// Daire stili (turuncu)
const circleStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'orange',
        width: 2,
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 165, 0, 0.3)', // Turuncu renkte hafif dolgu
    }),
});

// Çizgi stili (yeşil)
const lineStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'green',
        width: 2,
    }),
});

// Poligon stili (kırmızı)
const polygonStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'red',
        width: 2,
    }),
    fill: new ol.style.Fill({
        color: 'rgba(255, 0, 0, 0.3)', // Kırmızı renkte hafif dolgu
    }),
});

// Nokta stili (marker)
const markerStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: 'mark.png', // İkon dosya yolu
        scale: 0.09 // İkon boyutu
    })
});

// Şekil çizim işlemini başlatan fonksiyon
function startDrawingShape() {
    if (draw) {
        draw.setActive(false); // Önceki çizim etkileşimini devre dışı bırak
        map.removeInteraction(draw); // Haritadan kaldır
    }

    // Seçilen şekil türüne göre etkileşimi ayarla
    switch (selectedShapeType) {
        case 'POINT':
            draw = new ol.interaction.Draw({
                source: vectorSource,
                type: 'Point'
            });
            break;
        case 'LINESTRING':
            draw = new ol.interaction.Draw({
                source: vectorSource,
                type: 'LineString'
            });
            break;
        case 'POLYGON':
            draw = new ol.interaction.Draw({
                source: vectorSource,
                type: 'Polygon'
            });
            break;
        case 'CIRCLE':
            draw = new ol.interaction.Draw({
                source: vectorSource,
                type: 'Circle'
            });
            break;
        default:
            console.error('Geçersiz şekil türü:', selectedShapeType);
            return;
    }

    // Çizim sona erdiğinde tetiklenecek olay
    draw.on('drawend', function (event) {
        const feature = event.feature;
        const geometry = feature.getGeometry();

        // Eğer şekil daire ise, poligon olarak değiştir
        if (geometry instanceof ol.geom.Circle) {
            const polygonGeometry = circleToPolygon(feature); // Poligon haline getir
            feature.setGeometry(polygonGeometry);
            document.getElementById('shapeGeometry').value = format.writeGeometry(polygonGeometry); // Güncellenmiş geometri
        } else {
            document.getElementById('shapeGeometry').value = format.writeGeometry(geometry); // Daire değilse, mevcut geometri
        }

        // Geometrinin türüne göre stil belirle
        const geometryType = feature.getGeometry().getType();
        switch (geometryType) {
            case 'Point':
                feature.setStyle(markerStyle); // Nokta stili
                break;
            case 'LineString':
                feature.setStyle(lineStyle); // Çizgi stili
                break;
            case 'Polygon':
                feature.setStyle(polygonStyle); // Poligon stili
                break;
            case 'Circle':
                feature.setStyle(circleStyle); // Daire stili
                break;
            default:
                console.error('Geometrinin türü tanımlanmadı:', geometryType);
                break;
        }

        currentFeature = feature; // Geçerli şekli ayarla
        document.getElementById('shapePanel').style.display = 'block'; // Şekil panelini göster
    });

    map.addInteraction(draw); // Haritaya çizim etkileşimini ekle
}



// Nokta ekleme butonuna tıklama olayı
document.getElementById('addPointBtn').addEventListener('click', () => {
    document.getElementById('shapeSelectModal').style.display = 'block'; // Şekil seçme modülünü göster
});

// Şekil seçme modülünü kapatma butonuna tıklama olayı
document.getElementById('closeShapeSelectModal').addEventListener('click', () => {
    document.getElementById('shapeSelectModal').style.display = 'none'; // Modülü kapat
});

// Şekil seçme formuna gönderme olayı
document.getElementById('shapeSelectForm').addEventListener('submit', (e) => {
    e.preventDefault(); // Varsayılan davranışı engelle
    selectedShapeType = document.getElementById('shapeType').value; // Seçilen şekil türünü al
    document.getElementById('shapeSelectModal').style.display = 'none'; // Modülü kapat
    startDrawingShape(); // Çizim işlemini başlat
});

// Şekil kaydetme butonuna tıklama olayı
document.getElementById('saveShapeBtn').addEventListener('click', () => {
    const name = document.getElementById('shapeName').value; // Şekil ismini al

    if (!name) {
        alert('İsim gerekli'); // İsim girilmezse uyar
        return;
    }

    const geometry = currentFeature.getGeometry(); // Geçerli şeklin geometrisini al
    const wkt = format.writeGeometry(geometry); // WKT formatına çevir

    // Geometrinin kaydedileceği API
    fetch('http://localhost:5296/api/Geometries', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            geometry: wkt // JSON formatında gönder
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ağ yanıtı uygun değil'); // Hata durumunda
        }
        return response.json();
    })
    .then(data => {
        alert('Şekil başarıyla kaydedildi'); // Başarılı mesajı
        document.getElementById('shapePanel').style.display = 'none'; // Paneli kapat
    })
    .catch(error => {
        console.error('Şekil kaydetme hatası:', error); // Hata mesajı
        alert('Şekil kaydetme hatası. Detaylar için konsolu kontrol edin.');
    });
});

// Şekil silme fonksiyonu
function deleteFeature(id) {
    fetch(`http://localhost:5296/api/Geometries/${id}`, {
        method: 'DELETE' // Silme isteği
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ağ yanıtı uygun değil'); // Hata durumunda
        }
        return response.json();
    })
    .then(data => {
        alert('Şekil başarıyla silindi'); // Başarılı mesajı
        document.getElementById('queryBtn').click(); // Geometrileri güncelle
    })
    .catch(error => {
        console.error('Şekil silme hatası:', error); // Hata mesajı
        alert('Şekil silme hatası. Detaylar için konsolu kontrol edin.');
    });
}

// Şekilleri sorgulama butonuna tıklama olayı
document.getElementById('queryBtn').addEventListener('click', () => {
    fetch('http://localhost:5296/api/Geometries') // Geometrilerin alınacağı API
        .then(response => response.json())
        .then(data => {
            const geometries = data.data || data; // Gelen veriyi al
            if (Array.isArray(geometries)) {
                const tableBody = document.querySelector('#geometryTable tbody');
                tableBody.innerHTML = ''; // Önceki verileri temizle

                geometries.forEach(shape => {
                    const row = document.createElement('tr'); // Yeni satır oluştur

                    const idCell = document.createElement('td'); // ID hücresi
                    idCell.textContent = shape.id; // ID'yi yerleştir
                    row.appendChild(idCell);

                    const nameCell = document.createElement('td'); // İsim hücresi
                    nameCell.textContent = shape.name; // İsmi yerleştir
                    row.appendChild(nameCell);

                    const geometryCell = document.createElement('td'); // Geometri hücresi
                    geometryCell.textContent = shape.geometry; // Geometriyi yerleştir
                    row.appendChild(geometryCell);

                    const actionsCell = document.createElement('td'); // İşlem hücresi
                    actionsCell.className = 'actions-container';

                    // Göster butonu
                    const showBtn = document.createElement('button');
                    showBtn.id = `show-btn-${shape.id}`;
                    showBtn.className = 'action-btn show-btn';
                    showBtn.addEventListener('click', () => showFeature(shape));

                    // Güncelle butonu
                    const updateBtn = document.createElement('button');
                    updateBtn.id = `update-btn-${shape.id}`;
                    updateBtn.className = 'action-btn update-btn';// Güncelle butonu için olay dinleyicisi
                    updateBtn.addEventListener('click', () => {
                        selectedFeatureId = shape.id;
                        showUpdatePanel(shape); // Fonksiyonu burada çağır
                    });
                    
                    
                    // Sil butonu
                    const deleteBtn = document.createElement('button');
                    deleteBtn.id = `delete-btn-${shape.id}`;
                    deleteBtn.className = 'action-btn delete-btn';
                    deleteBtn.addEventListener('click', () => deleteFeature(shape.id)); // Silme fonksiyonunu çağır

                    // Butonları hücreye ekle
                    actionsCell.appendChild(showBtn);
                    actionsCell.appendChild(updateBtn);
                    actionsCell.appendChild(deleteBtn);
                    row.appendChild(actionsCell); // İşlem hücresini satıra ekle

                    tableBody.appendChild(row); // Satırı tabloya ekle
                });

                // DataTable'ı yeniden başlat
                if ($.fn.DataTable.isDataTable('#geometryTable')) {
                    $('#geometryTable').DataTable().destroy(); // Önceki DataTable'ı yok et
                }
                $('#geometryTable').DataTable(); // Yeni DataTable oluştur

                document.getElementById('queryModal').style.display = 'block'; // Sorgu modülünü göster
            } else {
                console.error('Beklenen veri yapısı sağlanamadı:', geometries);
            }
        })
        .catch(error => {
            console.error('Şekil yükleme hatası:', error); // Hata mesajı
        });
});

// Şekli gösteren fonksiyon
function showFeature(shape) {
    document.getElementById('queryModal').style.display = 'none'; // Modülü kapat

    const wkt = shape.geometry; // WKT geometrisini al
    const feature = format.readFeature(wkt, {
        dataProjection: 'EPSG:3857',
        featureProjection: 'EPSG:3857'
    });
    feature.setId(shape.id); // Şeklin ID'sini ayarla
    if (feature) {
        vectorSource.addFeature(feature); // Vektör kaynağına ekle

        const geometry = feature.getGeometry();
        let extent = geometry.getExtent(); // Geometrinin sınırlarını al
        map.getView().fit(extent, { duration: 1000, maxZoom: 8 }); // Haritayı şekle uyacak şekilde ayarla
    } else {
        console.error('Geometri işlenemedi:', wkt); // Hata mesajı
    }
}



// Güncelleme panelini gösteren fonksiyon
function showUpdatePanel(shape) {
    document.getElementById('queryModal').style.display = 'none'; // Sorgu panelini kapat
    document.getElementById('updateOptionsPanel').style.display = 'block'; // Güncelleme seçenekleri panelini aç

    // Manuel Güncelle butonuna tıklanırsa
    document.getElementById('manualUpdateBtn').onclick = function() {
        document.getElementById('updateOptionsPanel').style.display = 'none'; // Güncelleme seçenekleri panelini kapat

        const wkt = shape.geometry; // WKT geometrisini al
        const feature = format.readFeature(wkt, {
            dataProjection: 'EPSG:3857',
            featureProjection: 'EPSG:3857'
        });
        feature.setId(shape.id); // Şeklin ID'sini ayarla
        vectorSource.addFeature(feature); // Vektör kaynağına ekle

        // Haritayı geometrinin üzerine odakla
        const geometry = feature.getGeometry();
        const extent = geometry.getExtent();
        map.getView().fit(extent, { duration: 1000, maxZoom: 8 });

        // Sürükle-bırak etkileşimi ekle
        const modify = new ol.interaction.Modify({ source: vectorSource });
        map.addInteraction(modify);

        modify.on('modifyend', function (event) {
            const updatedFeature = event.features.item(0);
            const newGeometry = updatedFeature.getGeometry();
            const newWKT = format.writeGeometry(newGeometry); // Yeni WKT formatına çevir

            // Geometriyi güncelle
            updateGeometryWithManual(shape, newWKT); // Manuel güncelleme için fonksiyon
            map.removeInteraction(modify);
        });
    };

    // Panel ile Güncelle butonuna tıklanırsa
    document.getElementById('panelUpdateBtn').onclick = function() {
        document.getElementById('updateOptionsPanel').style.display = 'none'; // Güncelleme seçenekleri panelini kapat
        document.getElementById('geometryUpdatePanel').style.display = 'block'; // Geometri güncelleme panelini aç

        // Şeklin ID ve ismini panelde göster
        document.getElementById('updateShapeId').value = shape.id;
        document.getElementById('shapeName1').value = shape.name; // Eğer shape.name varsa
        document.getElementById('updateShapeGeometry').value = shape.geometry; // Eski geometrinin WKT'si

        // Güncelle butonuna tıklanırsa
        document.getElementById('submitUpdateBtn').onclick = function() {
            const newName = document.getElementById('shapeName1').value;
            const newWKT = document.getElementById('updateShapeGeometry').value;

            // Geometriyi güncelle
            updateGeometryWithPanel(shape, newWKT); // Panel güncelleme için fonksiyon
            shape.name = newName; // İsim güncellenir

            // Geometri güncelleme panelini kapat
            document.getElementById('geometryUpdatePanel').style.display = 'none';
            alert('Güncelleme başarılı!');
        };
    };
}



// Geometriyi güncelleyen fonksiyon
function updateGeometry(shape, newWKT) {
    const newName = document.getElementById('shapeName1').value.trim();
    if (!newName) {
        // Eski ismi nameUpdatePanel'da göster
        document.getElementById('nameInput').value = shape.name; // Eski ismi göster
        document.getElementById('nameUpdatePanel').style.display = 'block'; // Paneli aç
        
        // Geometri güncelleme panelini kapat
        document.getElementById('geometryUpdatePanel').style.display = 'none';
        return;
        
    }
    // Shape ID ve Name'i konsola yazdır
    console.log('Shape ID:', shape.id);
    console.log('Shape Name:', shape.name);

    const url = `http://localhost:5296/api/Geometries/${shape.id}`;
    console.log('Güncellenen URL:', url);

    // Gönderilecek body verisini oluştur
    const body = { 
        id: shape.id,
        name: newName, // Eğer backend'de 'name' alanı bekleniyorsa
        geometry: newWKT // Yeni WKT formatında geometri
    };

    // Fetch ile API'ye PUT isteği gönder
    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body) // JSON formatında veriyi gönderiyoruz
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Ağ yanıtı uygun değil");
        }
        return response.json();
    })
    .then(data => {
        console.log("Geometri başarıyla güncellendi:", data);
        alert("Güncellendi");
    })
    .catch(error => {
        console.error("Geometri güncelleme hatası:", error);
    });
}

// Panel ile güncelleme
function updateGeometryWithPanel(shape, newWKT) {
    const newName = document.getElementById('shapeName1').value.trim();

    const url = `http://localhost:5296/api/Geometries/${shape.id}`;
    const body = { 
        id: shape.id,
        name: newName,
        geometry: newWKT 
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Ağ yanıtı uygun değil");
        }
        return response.json();
    })
    .then(data => {
        console.log("Geometri panel ile başarıyla güncellendi:", data);
        alert("Güncellendi");
    })
    .catch(error => {
        console.error("Geometri güncelleme hatası:", error);
    });
}

// Manuel güncelleme
function updateGeometryWithManual(shape, newWKT) {
    const newName = shape.name; // Mevcut ismi kullan

    const url = `http://localhost:5296/api/Geometries/${shape.id}`;
    const body = { 
        id: shape.id,
        name: newName,
        geometry: newWKT 
    };

    fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Ağ yanıtı uygun değil");
        }
        return response.json();
    })
    .then(data => {
        console.log("Geometri manuel ile başarıyla güncellendi:", data);
        alert("Güncellendi");
    })
    .catch(error => {
        console.error("Geometri güncelleme hatası:", error);
    });
}

// Modül kapatma butonlarına olay dinleyicisi ekle
document.querySelectorAll('.close').forEach((element) => {
    element.addEventListener('click', () => {
        element.closest('.modal').style.display = 'none'; // Modülü kapat
    });
});

// Sayfa yüklendiğinde geometrileri yükle
window.onload = loadGeometries;



