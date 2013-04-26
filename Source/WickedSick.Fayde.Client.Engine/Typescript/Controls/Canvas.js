var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Fayde;
(function (Fayde) {
    /// <reference path="Panel.ts" />
    /// CODE
    (function (Controls) {
        var CanvasNode = (function (_super) {
            __extends(CanvasNode, _super);
            function CanvasNode(xobj) {
                        _super.call(this, xobj);
                this.LayoutUpdater.BreaksLayoutClipRender = true;
            }
            CanvasNode.prototype.AttachVisualChild = function (uie) {
                _super.prototype.AttachVisualChild.call(this, uie);
                this._UpdateIsLayoutContainerOnAdd(uie);
            };
            CanvasNode.prototype.DetachVisualChild = function (uie) {
                _super.prototype.DetachVisualChild.call(this, uie);
                this._UpdateIsLayoutContainerOnRemove(uie);
            };
            CanvasNode.prototype._UpdateIsLayoutContainerOnAdd = function (uie) {
                //If it's already a layout container, adding a child will not affect
                var lu = this.LayoutUpdater;
                if(lu.IsLayoutContainer) {
                    return;
                }
                var walker = Fayde.DeepTreeWalker(uie.XamlNode);
                var childNode;
                while(childNode = walker.Step()) {
                    if(!(childNode instanceof CanvasNode) && childNode.LayoutUpdater.IsLayoutContainer) {
                        lu.IsLayoutContainer = true;
                        break;
                    }
                }
            };
            CanvasNode.prototype._UpdateIsLayoutContainerOnRemove = function (uie) {
                //If it's not a layout container, removing a child will not affect
                var lu = this.LayoutUpdater;
                if(!lu.IsLayoutContainer) {
                    return;
                }
                var walker = Fayde.DeepTreeWalker(this);
                var childNode;
                while(childNode = walker.Step()) {
                    if(!(childNode instanceof CanvasNode) && childNode.LayoutUpdater.IsLayoutContainer) {
                        lu.IsLayoutContainer = true;
                        break;
                    }
                }
                lu.IsLayoutContainer = false;
            };
            CanvasNode.prototype.ComputeBounds = function (baseComputer, lu) {
                var surface = this._Surface;
                if(surface && this.IsAttached && this.IsTopLevel) {
                    // a toplevel (non-popup) canvas doesn't subscribe to the same bounds computation as others
                    var surfaceSize = surface.Extents;
                    rect.set(lu.Extents, 0, 0, surfaceSize.Width, surfaceSize.Height);
                    rect.copyTo(lu.Extents, lu.ExtentsWithChildren);
                    rect.copyTo(lu.Extents, lu.Bounds);
                    rect.copyTo(lu.Bounds, lu.BoundsWithChildren);
                    lu.ComputeGlobalBounds();
                    lu.ComputeSurfaceBounds();
                } else {
                    _super.prototype.ComputeBounds.call(this, baseComputer, lu);
                }
            };
            return CanvasNode;
        })(Controls.PanelNode);
        Controls.CanvasNode = CanvasNode;        
        Nullstone.RegisterType(CanvasNode, "CanvasNode");
        function invalidateTopLeft(d, args) {
            if(!(d instanceof Fayde.UIElement)) {
                return;
            }
            var n;
            var lu;
            var uie = d;
            if(uie instanceof Canvas) {
                n = uie.XamlNode;
                if(n.VisualParentNode == null) {
                    lu = n.LayoutUpdater;
                    lu.UpdateTransform();
                    lu.InvalidateArrange();
                }
            }
            var vpNode = uie.XamlNode.VisualParentNode;
            if(!(vpNode instanceof CanvasNode)) {
                return;
            }
            n = uie.XamlNode;
            lu = n.LayoutUpdater;
            var childFinal = rect.fromSize(lu.DesiredSize);
            childFinal.X = Canvas.GetLeft(uie);
            childFinal.Y = Canvas.GetTop(uie);
            if(uie.UseLayoutRounding) {
                childFinal.X = Math.round(childFinal.X);
                childFinal.Y = Math.round(childFinal.Y);
                childFinal.Width = Math.round(childFinal.Width);
                childFinal.Height = Math.round(childFinal.Height);
            }
            lu.LayoutSlot = childFinal;
            lu.InvalidateArrange();
        }
        var Canvas = (function (_super) {
            __extends(Canvas, _super);
            function Canvas() {
                _super.apply(this, arguments);

            }
            Canvas.TopProperty = DependencyProperty.RegisterAttached("Top", function () {
                return Number;
            }, Canvas, 0.0, invalidateTopLeft);
            Canvas.GetTop = function GetTop(d) {
                return d.GetValue(Canvas.TopProperty);
            };
            Canvas.SetTop = function SetTop(d, value) {
                d.SetValue(Canvas.TopProperty, value);
            };
            Canvas.LeftProperty = DependencyProperty.RegisterAttached("Left", function () {
                return Number;
            }, Canvas, 0.0, invalidateTopLeft);
            Canvas.GetLeft = function GetLeft(d) {
                return d.GetValue(Canvas.LeftProperty);
            };
            Canvas.SetLeft = function SetLeft(d, value) {
                d.SetValue(Canvas.LeftProperty, value);
            };
            Canvas.prototype._MeasureOverride = function (availableSize, error) {
                var childSize = size.createInfinite();
                var enumerator = this.XamlNode.GetVisualTreeEnumerator();
                while(enumerator.MoveNext()) {
                    var childNode = enumerator.Current;
                    childNode.LayoutUpdater._Measure(childSize, error);
                }
                return new size();
            };
            Canvas.prototype._ArrangeOverride = function (finalSize, error) {
                var enumerator = this.XamlNode.GetVisualTreeEnumerator();
                while(enumerator.MoveNext()) {
                    var childNode = enumerator.Current;
                    var lu = childNode.LayoutUpdater;
                    var childFinal = rect.fromSize(lu.DesiredSize);
                    childFinal.X = Canvas.GetLeft(childNode.XObject);
                    childFinal.Y = Canvas.GetTop(childNode.XObject);
                    lu._Arrange(childFinal, error);
                }
                return finalSize;
            };
            return Canvas;
        })(Controls.Panel);
        Controls.Canvas = Canvas;        
        Nullstone.RegisterType(Canvas, "Canvas");
    })(Fayde.Controls || (Fayde.Controls = {}));
    var Controls = Fayde.Controls;
})(Fayde || (Fayde = {}));
//@ sourceMappingURL=Canvas.js.map
