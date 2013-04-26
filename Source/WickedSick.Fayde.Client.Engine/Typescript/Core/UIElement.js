var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="DependencyObject.ts" />
/// <reference path="XamlNode.ts" />
/// <reference path="Providers/Enums.ts" />
/// <reference path="Enums.ts" />
/// <reference path="../Media/Effects/Effect.ts"/>
/// <reference path="../Media/Transform.ts"/>
/// <reference path="../Media/Projection.ts"/>
/// <reference path="../Primitives/Point.ts"/>
/// CODE
/// <reference path="../Engine/Surface.ts" />
/// <reference path="Walkers.ts" />
/// <reference path="LayoutUpdater.ts" />
/// <reference path="Providers/InheritedProvider.ts" />
/// <reference path="Providers/InheritedProviderStore.ts"/>
/// <reference path="../Runtime/MulticastEvent.ts"/>
/// <reference path="RoutedEvent.ts"/>
/// <reference path="../Engine/Interfaces.ts"/>
/// <reference path="../Media/GeneralTransform.ts"/>
var Fayde;
(function (Fayde) {
    var UINode = (function (_super) {
        __extends(UINode, _super);
        function UINode(xobj) {
                _super.call(this, xobj);
            this.IsTopLevel = false;
            this.IsLoaded = false;
            this.LayoutUpdater = new Fayde.LayoutUpdater(this);
            this.LayoutUpdater.SetContainerMode(false);
        }
        UINode.prototype.SetSurface = function (surface) {
            this._Surface = surface;
            this.LayoutUpdater.Surface = surface;
        };
        UINode.prototype.GetVisualRoot = function () {
            var curNode = this;
            var vpNode;
            while(vpNode = curNode.VisualParentNode) {
                curNode = vpNode;
            }
            return curNode;
        };
        UINode.prototype.GetInheritedEnumerator = function () {
            return this.GetVisualTreeEnumerator(Fayde.VisualTreeDirection.Logical);
        };
        UINode.prototype.OnIsAttachedChanged = function (newIsAttached) {
            this.LayoutUpdater.OnIsAttachedChanged(newIsAttached, this.VisualParentNode);
        };
        UINode.prototype.SetIsLoaded = function (value) {
        };
        UINode.prototype.AttachVisualChild = function (uie) {
            var lu = this.LayoutUpdater;
            lu.UpdateBounds(true);
            lu.InvalidateMeasure();
            lu.PreviousConstraint = undefined;
            var un = uie.XamlNode;
            un.VisualParentNode = this;
            un.VisualParentNode.SetSurface(this._Surface);
            this.XObject._Store.PropagateInheritedOnAdd(uie);
            un.LayoutUpdater.OnAddedToTree();
        };
        UINode.prototype.DetachVisualChild = function (uie) {
            var lu = this.LayoutUpdater;
            var un = uie.XamlNode;
            lu.Invalidate(un.LayoutUpdater.SubtreeBounds);
            lu.InvalidateMeasure();
            un.VisualParentNode.SetSurface(null);
            un.VisualParentNode = null;
            un.LayoutUpdater.OnRemovedFromTree();
            this.XObject._Store.ClearInheritedOnRemove(uie);
        };
        UINode.prototype.Focus = function () {
            return false;
        };
        UINode.prototype._EmitFocusChange = function (type) {
            if(type === "got") {
                this._EmitGotFocus();
            } else if(type === "lost") {
                this._EmitLostFocus();
            }
        };
        UINode.prototype._EmitLostFocus = function () {
            var e = new Fayde.RoutedEventArgs();
            var x = this.XObject;
            x.OnLostFocus(e);
            x.LostFocus.Raise(x, e);
        };
        UINode.prototype._EmitGotFocus = function () {
            var e = new Fayde.RoutedEventArgs();
            var x = this.XObject;
            x.OnGotFocus(e);
            x.GotFocus.Raise(x, e);
        };
        UINode.prototype._EmitKeyDown = function (args) {
            var x = this.XObject;
            x.OnKeyDown(args);
            x.KeyDown.Raise(x, args);
        };
        UINode.prototype._EmitKeyUp = function (args) {
            var x = this.XObject;
            x.OnKeyUp(args);
            x.KeyUp.Raise(x, args);
        };
        UINode.prototype._EmitLostMouseCapture = function (pos) {
            var x = this.XObject;
            var e = new Fayde.Input.MouseEventArgs(pos);
            x.OnLostMouseCapture(e);
            x.LostMouseCapture.Raise(x, e);
        };
        UINode.prototype._EmitMouseEvent = function (type, isLeftButton, isRightButton, args) {
            var x = this.XObject;
            switch(type) {
                case InputType.MouseUp:
                    if(isLeftButton) {
                        x.OnMouseLeftButtonUp(args);
                        x.MouseLeftButtonUp.Raise(x, args);
                    } else if(isRightButton) {
                        x.OnMouseRightButtonUp(args);
                        x.MouseRightButtonUp.Raise(x, args);
                    }
                    break;
                case InputType.MouseDown:
                    if(isLeftButton) {
                        x.OnMouseLeftButtonDown(args);
                        x.MouseLeftButtonDown.Raise(x, args);
                    } else if(isRightButton) {
                        x.OnMouseRightButtonDown(args);
                        x.MouseRightButtonDown.Raise(x, args);
                    }
                    break;
                case InputType.MouseLeave:
                    (x)._IsMouseOver = false;
                    x.OnMouseLeave(args);
                    x.MouseLeave.Raise(x, args);
                    break;
                case InputType.MouseEnter:
                    (x)._IsMouseOver = true;
                    x.OnMouseEnter(args);
                    x.MouseEnter.Raise(x, args);
                    break;
                case InputType.MouseMove:
                    x.OnMouseMove(args);
                    x.MouseMove.Raise(x, args);
                    break;
                case InputType.MouseWheel:
                    x.OnMouseWheel(args);
                    x.MouseWheel.Raise(x, args);
                    break;
                default:
                    return false;
            }
            return args.Handled;
        };
        UINode.prototype._HitTestPoint = function (ctx, p, uielist) {
            uielist.unshift(this);
        };
        UINode.prototype._InsideClip = function (ctx, lu, x, y) {
            var clip = this.XObject.Clip;
            if(!clip) {
                return true;
            }
            var np = new Point(x, y);
            lu.TransformPoint(np);
            if(!rect.containsPoint(clip.GetBounds(), np)) {
                return false;
            }
            return ctx.IsPointInClipPath(clip, np);
        };
        UINode.prototype.CanCaptureMouse = function () {
            return true;
        };
        UINode.prototype.CaptureMouse = function () {
            if(!this.IsAttached) {
                return false;
            }
            this._Surface.SetMouseCapture(this);
            return true;
        };
        UINode.prototype.ReleaseMouseCapture = function () {
            if(!this.IsAttached) {
                return;
            }
            this._Surface.ReleaseMouseCapture(this);
        };
        UINode.prototype._ResortChildrenByZIndex = function () {
            Warn("_Dirty.ChildrenZIndices only applies to Panel subclasses");
        };
        UINode.prototype.InvalidateParent = function (r) {
            var vpNode = this.VisualParentNode;
            if(vpNode) {
                vpNode.LayoutUpdater.Invalidate(r);
            } else if(this.IsAttached) {
                this._Surface._Invalidate(r);
            }
        };
        UINode.prototype.InvalidateClip = function (newClip) {
            var lu = this.LayoutUpdater;
            if(!newClip) {
                rect.clear(lu.ClipBounds);
            } else {
                rect.copyTo(newClip.GetBounds(), lu.ClipBounds);
            }
            this.InvalidateParent(lu.SubtreeBounds);
            lu.UpdateBounds(true);
            lu.ComputeComposite();
        };
        UINode.prototype.InvalidateEffect = function (newEffect) {
            var lu = this.LayoutUpdater;
            var changed = (newEffect) ? newEffect.GetPadding(lu.EffectPadding) : false;
            this.InvalidateParent(lu.SubtreeBounds);
            if(changed) {
                lu.UpdateBounds();
            }
            lu.ComputeComposite();
        };
        UINode.prototype.InvalidateVisibility = function () {
            var lu = this.LayoutUpdater;
            lu.UpdateTotalRenderVisibility();
            this.InvalidateParent(lu.SubtreeBounds);
        };
        UINode.prototype.IsAncestorOf = function (uin) {
            var vpNode = uin;
            while(vpNode && vpNode !== this) {
                vpNode = vpNode.VisualParentNode;
            }
            return vpNode === this;
        };
        UINode.prototype.TranformToVisual = function (uin) {
            if(uin && !uin.IsAttached) {
                throw new ArgumentException("UIElement not attached.");
            }
            var curNode = this;
            var ok = false;
            var surface = this._Surface;
            if(this.IsAttached) {
                while(curNode) {
                    if(curNode.IsTopLevel) {
                        ok = true;
                    }
                    curNode = curNode.VisualParentNode;
                }
            }
            if(!ok) {
                throw new ArgumentException("UIElement not attached.");
            }
            if(uin && !uin.IsTopLevel) {
                ok = false;
                curNode = uin.VisualParentNode;
                if(curNode && uin.IsAttached) {
                    while(curNode) {
                        if(curNode.IsTopLevel) {
                            ok = true;
                        }
                        curNode.VisualParentNode;
                    }
                }
                if(!ok) {
                    throw new ArgumentException("UIElement not attached.");
                }
            }
            return this.LayoutUpdater.TransformToVisual(uin);
        };
        return UINode;
    })(Fayde.XamlNode);
    Fayde.UINode = UINode;    
    Nullstone.RegisterType(UINode, "UINode");
    var UIElement = (function (_super) {
        __extends(UIElement, _super);
        function UIElement() {
            _super.apply(this, arguments);

            this._IsMouseOver = false;
            this.LostFocus = new Fayde.RoutedEvent();
            this.GotFocus = new Fayde.RoutedEvent();
            this.LostMouseCapture = new Fayde.RoutedEvent();
            this.KeyDown = new MulticastEvent();
            this.KeyUp = new MulticastEvent();
            this.MouseLeftButtonUp = new Fayde.RoutedEvent();
            this.MouseRightButtonUp = new Fayde.RoutedEvent();
            this.MouseLeftButtonDown = new Fayde.RoutedEvent();
            this.MouseRightButtonDown = new Fayde.RoutedEvent();
            this.MouseLeave = new Fayde.RoutedEvent();
            this.MouseEnter = new Fayde.RoutedEvent();
            this.MouseMove = new Fayde.RoutedEvent();
            this.MouseWheel = new Fayde.RoutedEvent();
        }
        UIElement.prototype.CreateStore = function () {
            var s = new Fayde.Providers.InheritedProviderStore(this);
            s.SetProviders([
                null, 
                new Fayde.Providers.LocalValueProvider(), 
                null, 
                null, 
                null, 
                new Fayde.Providers.InheritedProvider(), 
                null, 
                new Fayde.Providers.DefaultValueProvider(), 
                new Fayde.Providers.AutoCreateProvider()
            ]);
            return s;
        };
        UIElement.prototype.CreateNode = function () {
            return new UINode(this);
        };
        UIElement.ClipProperty = DependencyProperty.RegisterCore("Clip", function () {
            return Fayde.Media.Geometry;
        }, UIElement);
        UIElement.EffectProperty = DependencyProperty.Register("Effect", function () {
            return Fayde.Media.Effects.Effect;
        }, UIElement);
        UIElement.IsHitTestVisibleProperty = DependencyProperty.RegisterCore("IsHitTestVisible", function () {
            return Boolean;
        }, UIElement, true);
        UIElement.OpacityMaskProperty = DependencyProperty.RegisterCore("OpacityMask", function () {
            return Fayde.Media.Brush;
        }, UIElement);
        UIElement.OpacityProperty = DependencyProperty.RegisterCore("Opacity", function () {
            return Number;
        }, UIElement, 1.0);
        UIElement.ProjectionProperty = DependencyProperty.Register("Projection", function () {
            return Fayde.Media.Projection;
        }, UIElement);
        UIElement.RenderTransformProperty = DependencyProperty.Register("RenderTransform", function () {
            return Fayde.Media.Transform;
        }, UIElement);
        UIElement.RenderTransformOriginProperty = DependencyProperty.Register("RenderTransformOrigin", function () {
            return Point;
        }, UIElement);
        UIElement.TagProperty = DependencyProperty.Register("Tag", function () {
            return Object;
        }, UIElement);
        UIElement.UseLayoutRoundingProperty = DependencyProperty.RegisterInheritable("UseLayoutRounding", function () {
            return Boolean;
        }, UIElement, true, undefined, undefined, Fayde.Providers._Inheritable.UseLayoutRounding);
        UIElement.VisibilityProperty = DependencyProperty.RegisterCore("Visibility", function () {
            return new Enum(Fayde.Visibility);
        }, UIElement, Fayde.Visibility.Visible);
        Object.defineProperty(UIElement.prototype, "IsMouseOver", {
            get: function () {
                return this._IsMouseOver;
            },
            enumerable: true,
            configurable: true
        });
        UIElement.prototype.Focus = function () {
            return this.XamlNode.Focus();
        };
        UIElement.prototype.TranformToVisual = function (uie) {
            var uin = (uie) ? uie.XamlNode : null;
            return this.XamlNode.TranformToVisual(uin);
        };
        UIElement.prototype.OnGotFocus = function (e) {
        };
        UIElement.prototype.OnLostFocus = function (e) {
        };
        UIElement.prototype.OnLostMouseCapture = function (e) {
        };
        UIElement.prototype.OnKeyDown = function (e) {
        };
        UIElement.prototype.OnKeyUp = function (e) {
        };
        UIElement.prototype.OnMouseEnter = function (e) {
        };
        UIElement.prototype.OnMouseLeave = function (e) {
        };
        UIElement.prototype.OnMouseLeftButtonDown = function (e) {
        };
        UIElement.prototype.OnMouseLeftButtonUp = function (e) {
        };
        UIElement.prototype.OnMouseMove = function (e) {
        };
        UIElement.prototype.OnMouseRightButtonDown = function (e) {
        };
        UIElement.prototype.OnMouseRightButtonUp = function (e) {
        };
        UIElement.prototype.OnMouseWheel = function (e) {
        };
        return UIElement;
    })(Fayde.DependencyObject);
    Fayde.UIElement = UIElement;    
    Nullstone.RegisterType(UIElement, "UIElement");
})(Fayde || (Fayde = {}));
//@ sourceMappingURL=UIElement.js.map
